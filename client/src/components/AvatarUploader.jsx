import { useRef, useState } from 'react';
import { ProfileAPI, errorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Avatar from './Avatar';
import Icon from './Icon';

const MAX_BYTES = 2 * 1024 * 1024;
const TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/** Square center-crop + resize in the browser so uploads stay small and fast. */
function prepareImage(file, size = 512) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const side = Math.min(img.width, img.height);
      const canvas = document.createElement('canvas');
      canvas.width = Math.min(size, side);
      canvas.height = canvas.width;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob(
        (blob) => (blob ? resolve(new File([blob], 'avatar.jpg', { type: 'image/jpeg' })) : reject(new Error('Could not process image'))),
        'image/jpeg',
        0.88
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('This file could not be read as an image'));
    };
    img.src = url;
  });
}

export default function AvatarUploader() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [progress, setProgress] = useState(null);
  const [dragging, setDragging] = useState(false);

  const upload = async (file) => {
    if (!file) return;
    if (!TYPES.includes(file.type)) return toast.error('Please choose a JPG, PNG or WEBP image.');
    if (file.size > MAX_BYTES * 4) return toast.error('That image is too large. Please use one under 8 MB.');

    let prepared;
    try {
      prepared = await prepareImage(file);
    } catch (e) {
      return toast.error(e.message);
    }
    const localUrl = URL.createObjectURL(prepared);
    setPreview(localUrl);
    setProgress(0);
    try {
      const data = await ProfileAPI.uploadAvatar(prepared, setProgress);
      setUser(data.user);
      toast.success('Profile picture updated');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setProgress(null);
      setPreview(null);
      URL.revokeObjectURL(localUrl);
    }
    return null;
  };

  const remove = async () => {
    try {
      const data = await ProfileAPI.removeAvatar();
      setUser(data.user);
      toast.info('Profile picture removed');
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <div
      className={`avatar-uploader ${dragging ? 'is-dragging' : ''}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        upload(e.dataTransfer.files?.[0]);
      }}
    >
      <button
        type="button"
        className="avatar-uploader__pic"
        onClick={() => inputRef.current?.click()}
        aria-label="Change profile picture"
        disabled={progress !== null}
      >
        {preview ? (
          <span className="avatar" style={{ width: 120, height: 120 }}>
            <img src={preview} alt="New profile picture preview" />
          </span>
        ) : (
          <Avatar src={user.avatarUrl} name={user.name} size={120} ring />
        )}
        <span className="avatar-uploader__overlay">
          <Icon name="camera" size={22} />
        </span>
        {progress !== null && (
          <svg className="avatar-uploader__progress" viewBox="0 0 128 128" aria-hidden="true">
            <circle cx="64" cy="64" r="61" strokeDasharray={383} strokeDashoffset={383 - (progress / 100) * 383} />
          </svg>
        )}
      </button>
      <div className="avatar-uploader__info">
        <h4>Profile picture</h4>
        <p className="muted">Drag an image here or click the photo. JPG, PNG or WEBP — we crop it to a square automatically.</p>
        <div className="btn-row">
          <button type="button" className="btn btn--secondary btn--sm" onClick={() => inputRef.current?.click()} disabled={progress !== null}>
            <Icon name="upload" size={16} /> {progress !== null ? `Uploading ${progress}%` : 'Upload photo'}
          </button>
          {user.avatarUrl && (
            <button type="button" className="btn btn--ghost btn--sm btn--danger-text" onClick={remove} disabled={progress !== null}>
              <Icon name="trash" size={16} /> Remove
            </button>
          )}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={(e) => {
          upload(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
    </div>
  );
}
