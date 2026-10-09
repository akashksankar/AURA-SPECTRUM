import { Track } from '../types/audio';

// Helper to decode string with different encodings commonly found in ID3v2
function decodeString(bytes: Uint8Array, encodingByte: number): string {
  try {
    if (encodingByte === 0) {
      // ISO-8859-1
      return new TextDecoder('latin1').decode(bytes).replace(/\0+$/, '');
    } else if (encodingByte === 1 || encodingByte === 2) {
      // UTF-16
      return new TextDecoder('utf-16').decode(bytes).replace(/\0+$/, '');
    } else {
      // UTF-8
      return new TextDecoder('utf-8').decode(bytes).replace(/\0+$/, '');
    }
  } catch {
    return new TextDecoder('utf-8', { fatal: false }).decode(bytes).replace(/\0+$/, '');
  }
}

// Extract ID3v2 tags from ArrayBuffer
function parseID3v2(buffer: ArrayBuffer): {
  title?: string;
  artist?: string;
  album?: string;
  year?: string;
  artworkUrl?: string;
} {
  const bytes = new Uint8Array(buffer);
  if (bytes.length < 10) return {};

  // Check ID3 header 'ID3'
  if (bytes[0] !== 0x49 || bytes[1] !== 0x44 || bytes[2] !== 0x33) {
    return {};
  }

  const version = bytes[3];
  const tagSize = ((bytes[6] & 0x7f) << 21) |
                  ((bytes[7] & 0x7f) << 14) |
                  ((bytes[8] & 0x7f) << 7) |
                  (bytes[9] & 0x7f);

  let offset = 10;
  const end = Math.min(10 + tagSize, bytes.length);

  const result: {
    title?: string;
    artist?: string;
    album?: string;
    year?: string;
    artworkUrl?: string;
  } = {};

  while (offset + 10 < end) {
    // Read 4-character frame ID
    const frameId = String.fromCharCode(
      bytes[offset],
      bytes[offset + 1],
      bytes[offset + 2],
      bytes[offset + 3]
    );

    // Frame size
    let frameSize = 0;
    if (version === 4) {
      // Syncsafe int in ID3v2.4
      frameSize = ((bytes[offset + 4] & 0x7f) << 21) |
                  ((bytes[offset + 5] & 0x7f) << 14) |
                  ((bytes[offset + 6] & 0x7f) << 7) |
                  (bytes[offset + 7] & 0x7f);
    } else {
      // Regular 32-bit int in ID3v2.3
      frameSize = (bytes[offset + 4] << 24) |
                  (bytes[offset + 5] << 16) |
                  (bytes[offset + 6] << 8) |
                  bytes[offset + 7];
    }

    if (frameSize <= 0 || offset + 10 + frameSize > end) {
      break;
    }

    const frameData = bytes.slice(offset + 10, offset + 10 + frameSize);
    offset += 10 + frameSize;

    if (frameData.length < 2) continue;

    const encoding = frameData[0];
    const textBytes = frameData.slice(1);

    if (frameId === 'TIT2') {
      result.title = decodeString(textBytes, encoding).trim();
    } else if (frameId === 'TPE1' || frameId === 'TPE2') {
      result.artist = decodeString(textBytes, encoding).trim();
    } else if (frameId === 'TALB') {
      result.album = decodeString(textBytes, encoding).trim();
    } else if (frameId === 'TYER' || frameId === 'TDRC') {
      result.year = decodeString(textBytes, encoding).slice(0, 4);
    } else if (frameId === 'APIC' && !result.artworkUrl) {
      // Attached Picture
      try {
        let picOffset = 1;
        // Find null terminator for mime type
        let mimeEnd = picOffset;
        while (mimeEnd < frameData.length && frameData[mimeEnd] !== 0) {
          mimeEnd++;
        }
        const mimeType = new TextDecoder('ascii').decode(frameData.slice(picOffset, mimeEnd)) || 'image/jpeg';
        picOffset = mimeEnd + 1; // Skip null

        // Picture type (1 byte)
        picOffset++;

        // Description null terminator (may be single or double zero depending on encoding)
        if (encoding === 1 || encoding === 2) {
          while (picOffset + 1 < frameData.length && !(frameData[picOffset] === 0 && frameData[picOffset + 1] === 0)) {
            picOffset += 2;
          }
          picOffset += 2;
        } else {
          while (picOffset < frameData.length && frameData[picOffset] !== 0) {
            picOffset++;
          }
          picOffset++;
        }

        if (picOffset < frameData.length) {
          const imageBytes = frameData.slice(picOffset);
          const blob = new Blob([imageBytes], { type: mimeType });
          result.artworkUrl = URL.createObjectURL(blob);
        }
      } catch (err) {
        console.warn('Could not parse APIC artwork frame:', err);
      }
    }
  }

  return result;
}

// Generate an algorithmic vibrant aesthetic palette for the track based on title/artist seed
export function generateTrackPalette(seedString: string) {
  let hash = 0;
  for (let i = 0; i < seedString.length; i++) {
    hash = (hash << 5) - hash + seedString.charCodeAt(i);
    hash |= 0;
  }
  const hue1 = Math.abs(hash) % 360;
  const hue2 = (hue1 + 45 + (Math.abs(hash >> 3) % 60)) % 360;
  const hue3 = (hue1 + 180 + (Math.abs(hash >> 5) % 60)) % 360;

  return {
    primary: `hsl(${hue1}, 85%, 60%)`,
    secondary: `hsl(${hue2}, 75%, 55%)`,
    accent: `hsl(${hue3}, 90%, 65%)`
  };
}

// Clean up filename into human readable track name
function cleanFileName(filename: string): { title: string; artist: string } {
  // Strip extension
  const base = filename.replace(/\.[^/.]+$/, '').trim();

  // Try standard delimiter "Artist - Title"
  const splitHyphen = base.split(/\s*[-–—]\s*/);
  if (splitHyphen.length >= 2) {
    const artist = splitHyphen[0].trim();
    const title = splitHyphen.slice(1).join(' - ').trim();
    if (artist && title) {
      return { artist, title };
    }
  }

  return {
    title: base.replace(/[_]/g, ' '),
    artist: 'Unknown Artist'
  };
}

// Get duration using audio element
function getAudioDuration(url: string): Promise<number> {
  return new Promise((resolve) => {
    const audio = new Audio();
    audio.preload = 'metadata';
    const cleanUp = () => {
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('error', onError);
    };
    const onLoaded = () => {
      cleanUp();
      resolve(isFinite(audio.duration) ? audio.duration : 0);
    };
    const onError = () => {
      cleanUp();
      resolve(0);
    };
    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('error', onError);
    audio.src = url;

    // Timeout fallback
    setTimeout(() => {
      cleanUp();
      resolve(0);
    }, 4000);
  });
}

// Main parser function for uploaded File
export async function parseAudioFile(file: File): Promise<Track> {
  const objectUrl = URL.createObjectURL(file);
  const { title: fallbackTitle, artist: fallbackArtist } = cleanFileName(file.name);

  let parsedTitle: string | undefined;
  let parsedArtist: string | undefined;
  let parsedAlbum: string | undefined;
  let parsedYear: string | undefined;
  let artworkUrl: string | undefined;

  try {
    // Read first 1MB of file for metadata tags
    const slice = file.slice(0, Math.min(file.size, 1024 * 1024));
    const arrayBuffer = await slice.arrayBuffer();
    const id3 = parseID3v2(arrayBuffer);

    if (id3.title) parsedTitle = id3.title;
    if (id3.artist) parsedArtist = id3.artist;
    if (id3.album) parsedAlbum = id3.album;
    if (id3.year) parsedYear = id3.year;
    if (id3.artworkUrl) artworkUrl = id3.artworkUrl;
  } catch (err) {
    console.warn('ID3 parsing skipped or failed:', err);
  }

  const duration = await getAudioDuration(objectUrl);
  const title = parsedTitle || fallbackTitle;
  const artist = parsedArtist || fallbackArtist;
  const palette = generateTrackPalette(`${title}-${artist}`);

  const extension = file.name.split('.').pop()?.toUpperCase() || 'AUDIO';

  return {
    id: `track-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title,
    artist,
    album: parsedAlbum || 'Local Collection',
    year: parsedYear,
    duration: duration > 0 ? duration : 180, // default if stream/unannounced
    url: objectUrl,
    artworkUrl,
    palette,
    isCustomUpload: true,
    fileSize: file.size,
    format: extension,
    dateAdded: Date.now()
  };
}
