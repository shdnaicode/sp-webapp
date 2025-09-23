import { useEffect, useRef, useState } from "react";
import Navbar from "../components/navbar";
import Footer from "../components/footer";
import Modal from "../components/modal";
import { apiFetch } from "../lib/api";
import { useAuth } from "../context/AuthContext";

function Settings() {
  const { user, token, applyAuthUpdate } = useAuth();
  const [username, setUsername] = useState(user?.username || "");
  const [email, setEmail] = useState(user?.email || "");
  const [profileMsg, setProfileMsg] = useState("");

  // Modal visibility
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);

  // Username modal state
  const [pendingUsername, setPendingUsername] = useState(username);
  const [savingUsername, setSavingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState("");

  // Email modal state
  const [pendingEmail, setPendingEmail] = useState(email);
  const [savingEmail, setSavingEmail] = useState(false);
  const [emailError, setEmailError] = useState("");

  // Password modal state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");
  const currentPwdRef = useRef(null);
  const newPwdRef = useRef(null);

  // Profile image modal state
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [imageMsg, setImageMsg] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const MIN_W = 128;
  const MIN_H = 128;

  // using shared Modal from components/modal.jsx

  const saveUsername = async () => {
    try {
      setUsernameError("");
      if (!pendingUsername.trim()) {
        setUsernameError("Username cannot be empty");
        return;
      }
      if (pendingUsername.trim().length > 50) {
        setUsernameError("Username too long");
        return;
      }
      setSavingUsername(true);
      const res = await apiFetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ username: pendingUsername.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to update username");
      applyAuthUpdate(data.token, data.user);
      setUsername(data.user?.username || pendingUsername.trim());
      setShowUsernameModal(false);
      setProfileMsg("Username updated");
    } catch (err) {
      setUsernameError(err.message || "Something went wrong");
    } finally {
      setSavingUsername(false);
    }
  };

  const saveEmail = async () => {
    try {
      setEmailError("");
      const e = pendingEmail.trim().toLowerCase();
      if (!e) { setEmailError("Email cannot be empty"); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) { setEmailError("Invalid email"); return; }
      setSavingEmail(true);
      const res = await apiFetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email: e }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to update email");
      applyAuthUpdate(data.token, data.user);
      setEmail(data.user?.email || e);
      setShowEmailModal(false);
      setProfileMsg("Email updated");
    } catch (err) {
      setEmailError(err.message || "Something went wrong");
    } finally {
      setSavingEmail(false);
    }
  };

  const savePassword = async () => {
    try {
      setPasswordError("");
      setPasswordMsg("");
      if (!currentPassword || !newPassword) { setPasswordError("All fields are required"); return; }
      if (newPassword.length < 6 || newPassword.length > 100) { setPasswordError("Password must be 6-100 characters"); return; }
      setSavingPassword(true);
      const res = await apiFetch("/api/user/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to update password");
      setPasswordMsg("Password updated");
      setCurrentPassword("");
      setNewPassword("");
      setShowPasswordModal(false);
    } catch (err) {
      setPasswordError(err.message || "Something went wrong");
    } finally {
      setSavingPassword(false);
    }
  };

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  // Ensure Current Password gets focus when the modal opens
  useEffect(() => {
    if (showPasswordModal) {
      // Defer to next tick to ensure inputs are mounted
      const t = setTimeout(() => currentPwdRef.current?.focus({ preventScroll: true }), 0);
      return () => clearTimeout(t);
    }
  }, [showPasswordModal]);

  const onPickImage = (e) => {
    const file = e.target.files?.[0];
    setImageMsg("");
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      if (img.width < MIN_W || img.height < MIN_H) {
        setImageFile(null);
        setImagePreview("");
        setImageMsg(`Image too small. Minimum ${MIN_W}x${MIN_H}px`);
        URL.revokeObjectURL(url);
      } else {
        setImageFile(file);
        setImagePreview(url);
      }
    };
    img.onerror = () => {
      setImageMsg("Invalid image file");
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const onUploadImage = async () => {
    if (!imageFile) return;
    setUploading(true);
    setImageMsg("");
    try {
      const form = new FormData();
      form.append("image", imageFile);
      const res = await apiFetch("/api/user/profile-image", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Upload failed");
      applyAuthUpdate(data.token, data.user);
      setImageMsg("Profile picture updated");
      setImageModalOpen(false);
      setImageFile(null);
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      setImagePreview("");
    } catch (err) {
      setImageMsg(err.message || "Upload failed");
    } finally {
      setUploading(false);  
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="mx-auto max-w-3xl p-6 flex-1 w-full">
        <div className="nb-card">
          <div className="border-b-2 p-4 text-lg font-semibold">Settings</div>
          <div className="grid gap-6 p-4 md:grid-cols-2">
            <div className="space-y-1">
              <div className="text-sm font-semibold">Profile</div>
              <div className="text-xs text-gray-600">Manage your account info.</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-semibold">Security</div>
              <div className="text-xs text-gray-600">Password management.</div>
            </div>

            <div>
              <div className="text-xs text-gray-500">Username</div>
              <div className="mt-1 flex items-center justify-between rounded-md border-2 p-2 nb-card">
                <div className="text-sm">{username}</div>
                <button type="button" onClick={() => { setPendingUsername(username); setUsernameError(""); setShowUsernameModal(true); }} className="rounded-md border px-3 py-1 text-sm nb-button">Change</button>
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Password</div>
              <div className="mt-1 flex items-center justify-between rounded-md border-2 p-2 nb-card">
                <div className="text-sm text-gray-600">••••••••</div>
                <button type="button" onClick={() => { setPasswordError(""); setPasswordMsg(""); setCurrentPassword(""); setNewPassword(""); setShowPasswordModal(true); }} className="rounded-md border px-3 py-1 text-sm nb-button">Change</button>
              </div>
              {passwordMsg && <div className="mt-2 text-xs text-gray-700">{passwordMsg}</div>}
            </div>

            <div>
              <div className="text-xs text-gray-500">Email</div>
              <div className="mt-1 flex items-center justify-between rounded-md border-2 p-2 nb-card">
                <div className="text-sm">{email}</div>
                <button type="button" onClick={() => { setPendingEmail(email); setEmailError(""); setShowEmailModal(true); }} className="rounded-md border px-3 py-1 text-sm nb-button">Change</button>
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Profile picture</div>
              <div className="mt-1 flex items-center justify-between rounded-md border-2 p-2 nb-card">
                <div className="text-xs text-gray-600">Minimum {MIN_W}x{MIN_H}px</div>
                <button type="button" onClick={() => setImageModalOpen(true)} className="rounded-md border px-3 py-1 text-sm nb-button">Change</button>
              </div>
            </div>
          </div>
          {profileMsg && <div className="px-4 pb-4 text-xs text-gray-700">{profileMsg}</div>}
        </div>
      </div>

      {showUsernameModal && (
        <Modal open={true} title="Change Username" onClose={() => setShowUsernameModal(false)}>
          <label className="block text-sm">New Username</label>
          <input autoFocus value={pendingUsername} onChange={(e) => setPendingUsername(e.target.value)} className="mt-1 h-10 w-full rounded-md border-2 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          {usernameError && <div className="mt-2 text-xs text-red-600">{usernameError}</div>}
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={() => setShowUsernameModal(false)} className="rounded-md border px-3 py-2 text-sm nb-button">Cancel</button>
            <button type="button" onClick={saveUsername} disabled={savingUsername} className="rounded-md nb-button-primary px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60">{savingUsername ? "Saving..." : "Save"}</button>
          </div>
        </Modal>
      )}

      {showEmailModal && (
        <Modal open={true} title="Change Email" onClose={() => setShowEmailModal(false)}>
          <label className="block text-sm">New Email</label>
          <input autoFocus type="email" value={pendingEmail} onChange={(e) => setPendingEmail(e.target.value)} className="mt-1 h-10 w-full rounded-md border-2 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          {emailError && <div className="mt-2 text-xs text-red-600">{emailError}</div>}
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={() => setShowEmailModal(false)} className="rounded-md border px-3 py-2 text-sm nb-button">Cancel</button>
            <button type="button" onClick={saveEmail} disabled={savingEmail} className="rounded-md nb-button-primary px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60">{savingEmail ? "Saving..." : "Save"}</button>
          </div>
        </Modal>
      )}

      {showPasswordModal && (
        <Modal open={true} title="Change Password" onClose={() => setShowPasswordModal(false)}>
          <label className="block text-sm">Current Password</label>
          <input autoFocus ref={currentPwdRef} name="currentPassword" type="password" autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="mt-1 h-10 w-full rounded-md border-2 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          <label className="mt-3 block text-sm">New Password</label>
          <input ref={newPwdRef} name="newPassword" type="password" autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="mt-1 h-10 w-full rounded-md border-2 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          {passwordError && <div className="mt-2 text-xs text-red-600">{passwordError}</div>}
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={() => setShowPasswordModal(false)} className="rounded-md border px-3 py-2 text-sm nb-button">Cancel</button>
            <button type="button" onClick={savePassword} disabled={savingPassword} className="rounded-md nb-button-primary px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60">{savingPassword ? "Saving..." : "Save"}</button>
          </div>
        </Modal>
      )}

      {imageModalOpen && (
        <Modal open={true} title="Change Profile Picture" onClose={() => { setImageModalOpen(false); setImageFile(null); setImageMsg(""); if (imagePreview) URL.revokeObjectURL(imagePreview); setImagePreview(""); }}>
          <div className="text-xs text-gray-600">Minimum {MIN_W}x{MIN_H}px. JPG, PNG, or WEBP up to 5MB.</div>
          <div className="mt-3 flex items-center gap-3">
            <input ref={fileInputRef} type="file" accept="image/*" onChange={onPickImage} className="hidden" />
            <button type="button" onClick={() => fileInputRef.current?.click()} className="rounded-md border px-3 py-2 text-sm nb-button">Choose File</button>
            <button type="button" onClick={onUploadImage} disabled={!imageFile || uploading} className="rounded-md nb-button-primary px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60">{uploading ? "Uploading..." : "Upload"}</button>
          </div>
          {imageFile && <div className="mt-2 text-xs text-gray-700">Selected: {imageFile.name}</div>}
          {imagePreview && (
            <div className="mt-3">
              <div className="text-xs text-gray-600">Preview</div>
              <img src={imagePreview} alt="Preview" className="mt-1 max-h-48 w-auto rounded-md border" />
            </div>
          )}
          {imageMsg && <div className="mt-2 text-xs text-red-600">{imageMsg}</div>}
        </Modal>
      )}
      <Footer />
    </div>
  );
}

export default Settings;
