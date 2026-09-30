import JSZip from 'jszip';
import React, { useState, useEffect } from 'react';

/**
 * Compresses an image File, Blob, or Data URL into a ZIP Base64 format string.
 * Format: "ZIP_IMG:<base64-encoded-zip-payload>"
 *
 * @param {File|Blob|string} imageInput
 * @param {string} internalFileName
 * @returns {Promise<string>} ZIP-formatted string for DB storage
 */
export const compressImageToZip = async (imageInput, internalFileName = 'media_image.jpg') => {
  try {
    if (!imageInput) return '';

    let arrayBuffer;
    let mimeType = 'image/jpeg';

    if (typeof imageInput === 'string') {
      if (imageInput.startsWith('ZIP_IMG:')) {
        // Already compressed in ZIP format
        return imageInput;
      }
      if (imageInput.startsWith('data:')) {
        const matches = imageInput.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          mimeType = matches[1];
          const binaryStr = atob(matches[2]);
          const len = binaryStr.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
          }
          arrayBuffer = bytes.buffer;
        } else {
          const res = await fetch(imageInput);
          arrayBuffer = await res.arrayBuffer();
        }
      } else {
        const res = await fetch(imageInput);
        arrayBuffer = await res.arrayBuffer();
      }
    } else if (imageInput instanceof File || imageInput instanceof Blob) {
      arrayBuffer = await imageInput.arrayBuffer();
      if (imageInput.type) mimeType = imageInput.type;
    }

    if (!arrayBuffer) {
      return typeof imageInput === 'string' ? imageInput : '';
    }

    const ext = mimeType.split('/')[1] || 'jpg';
    const finalFileName = internalFileName.includes('.') ? internalFileName : `${internalFileName}.${ext}`;

    const zip = new JSZip();
    zip.file(finalFileName, arrayBuffer);

    const zipBase64 = await zip.generateAsync({
      type: 'base64',
      compression: 'DEFLATE',
      compressionOptions: { level: 9 }
    });

    return `ZIP_IMG:${zipBase64}`;
  } catch (err) {
    console.warn('Error compressing image to ZIP format, storing raw string:', err);
    return typeof imageInput === 'string' ? imageInput : '';
  }
};

/**
 * Decompresses/extracts an image from ZIP-formatted string or returns raw URL.
 *
 * @param {string} storedValue - DB value ("ZIP_IMG:...", Data URL, or URL)
 * @returns {Promise<string>} Data URL to display directly in <img> tag
 */
export const extractImageFromZip = async (storedValue) => {
  if (!storedValue || typeof storedValue !== 'string') return '';

  const cleanVal = storedValue.trim();

  if (cleanVal.startsWith('ZIP_IMG:')) {
    try {
      const base64Data = cleanVal.replace('ZIP_IMG:', '').trim();
      const zip = new JSZip();
      const loadedZip = await zip.loadAsync(base64Data, { base64: true });

      const fileNames = Object.keys(loadedZip.files);
      if (fileNames.length === 0) return '';

      const targetFile = loadedZip.files[fileNames[0]];
      const fileBlob = await targetFile.async('blob');

      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result || '');
        reader.onerror = () => resolve('');
        reader.readAsDataURL(fileBlob);
      });
    } catch (err) {
      console.warn('Error extracting image from ZIP archive:', err);
      return '';
    }
  }

  return cleanVal;
};

/**
 * Custom React Hook to resolve zipped/unzipped image URLs asynchronously.
 *
 * @param {string} initialSrc
 * @returns {string} resolved data URL or image source
 */
export const useZipImage = (initialSrc) => {
  const [displaySrc, setDisplaySrc] = useState('');

  useEffect(() => {
    let isMounted = true;

    if (!initialSrc) {
      setDisplaySrc('');
      return;
    }

    if (typeof initialSrc === 'string' && initialSrc.startsWith('ZIP_IMG:')) {
      extractImageFromZip(initialSrc).then((extracted) => {
        if (isMounted) setDisplaySrc(extracted);
      });
    } else {
      setDisplaySrc(initialSrc);
    }

    return () => {
      isMounted = false;
    };
  }, [initialSrc]);

  return displaySrc;
};

/**
 * Reusable ZipImage Component that handles ZIP decompression automatically.
 */
export const ZipImage = ({ src, alt = '', className = '', fallback = null, ...props }) => {
  const resolvedSrc = useZipImage(src);

  if (!resolvedSrc && fallback) {
    return fallback;
  }

  return (
    <img
      src={resolvedSrc || src}
      alt={alt}
      className={className}
      onError={(e) => {
        if (props.onError) props.onError(e);
      }}
      {...props}
    />
  );
};
