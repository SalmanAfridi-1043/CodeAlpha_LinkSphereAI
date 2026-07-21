import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import useAuth from '../hooks/useAuth'
import usePageTitle from '../hooks/usePageTitle'
import toast from 'react-hot-toast'
import Avatar from '../components/Avatar'

const Settings = () => {
  usePageTitle('Settings')
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [showDeleteConfirm, setShowDeleteConfirm]
    = useState(false)
  const [deleteInput, setDeleteInput]
    = useState('')
  const [deleting, setDeleting]
    = useState(false)

  // Change password state
  const [currentPassword, setCurrentPassword]
    = useState('')
  const [newPassword, setNewPassword]
    = useState('')
  const [confirmPassword, setConfirmPassword]
    = useState('')
  const [changingPassword, setChangingPassword]
    = useState(false)

  // Privacy state
  const [emailVisible, setEmailVisible]
    = useState(false)

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      toast.error('Fill all password fields')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    if (newPassword.length < 6) {
      toast.error('Min 6 characters')
      return
    }
    setChangingPassword(true)
    try {
      await api.put('/users/change-password', {
        currentPassword,
        newPassword
      })
      toast.success('Password changed! ✅')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      toast.error(
        err?.response?.data?.message
        || 'Failed to change password'
      )
    } finally {
      setChangingPassword(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteInput !== user?.username) {
      toast.error(
        'Type your username correctly'
      )
      return
    }
    setDeleting(true)
    try {
      await api.delete('/users/delete-account')
      toast.success('Account deleted')
      logout()
      navigate('/login')
    } catch (err) {
      toast.error('Failed to delete account')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="max-w-[620px] mx-auto
      px-4 py-6 flex flex-col gap-5">

      {/* Title */}
      <div>
        <h1 className="text-[22px] font-bold
          text-[var(--text-main)]">
          Settings
        </h1>
        <p className="text-[var(--text-muted)]
          text-[13px] mt-1">
          Manage your account and preferences
        </p>
      </div>

      {/* ── ACCOUNT INFO ── */}
      <div className="bg-[var(--bg-card)]
        border border-[var(--border)]
        rounded-2xl p-5">
        <h2 className="font-semibold
          text-[15px] text-[var(--text-main)]
          mb-4">
          👤 Account Info
        </h2>
        <div className="flex items-center gap-4">
          <Avatar
            src={user?.avatar}
            name={user?.name}
            size="lg"
            showRing={true}
          />
          <div>
            <p className="text-[var(--text-main)]
              font-semibold text-[15px]">
              {user?.name}
            </p>
            <p className="text-[var(--text-muted)]
              text-[13px]">
              @{user?.username}
            </p>
            <p className="text-[var(--text-muted)]
              text-[12px] mt-0.5">
              {user?.email}
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate(
            `/profile/${user?.username}`
          )}
          className="mt-4 w-full py-2.5
            rounded-xl text-[13px] font-medium
            border border-[var(--border)]
            text-[var(--text-main)]
            hover:border-[#6C63FF]
            hover:text-[#6C63FF] transition">
          View My Profile →
        </button>
      </div>

      {/* ── CHANGE PASSWORD ── */}
      <div className="bg-[var(--bg-card)]
        border border-[var(--border)]
        rounded-2xl p-5">
        <h2 className="font-semibold
          text-[15px] text-[var(--text-main)]
          mb-4">
          🔐 Change Password
        </h2>
        <div className="flex flex-col gap-3">
          <input
            type="password"
            value={currentPassword}
            onChange={e =>
              setCurrentPassword(e.target.value)}
            placeholder="Current password"
            className="w-full bg-[var(--bg-input)]
              border border-[var(--border)]
              rounded-xl px-4 py-2.5
              text-[var(--text-main)] text-[13px]
              focus:border-[#6C63FF]
              focus:ring-2 focus:ring-[#6C63FF22]
              outline-none transition"
          />
          <input
            type="password"
            value={newPassword}
            onChange={e =>
              setNewPassword(e.target.value)}
            placeholder="New password"
            className="w-full bg-[var(--bg-input)]
              border border-[var(--border)]
              rounded-xl px-4 py-2.5
              text-[var(--text-main)] text-[13px]
              focus:border-[#6C63FF]
              focus:ring-2 focus:ring-[#6C63FF22]
              outline-none transition"
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={e =>
              setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            className="w-full bg-[var(--bg-input)]
              border border-[var(--border)]
              rounded-xl px-4 py-2.5
              text-[var(--text-main)] text-[13px]
              focus:border-[#6C63FF]
              focus:ring-2 focus:ring-[#6C63FF22]
              outline-none transition"
          />
          <button
            onClick={handleChangePassword}
            disabled={changingPassword}
            className="w-full py-2.5 rounded-xl
              text-[13px] font-medium text-white
              bg-gradient-to-r from-[#6C63FF]
              to-[#FF6584]
              hover:shadow-[0_0_20px_#6C63FF44]
              disabled:opacity-50 transition">
            {changingPassword
              ? 'Changing...'
              : 'Change Password'}
          </button>
        </div>
      </div>

      {/* ── APPEARANCE ── */}
      <div className="bg-[var(--bg-card)]
        border border-[var(--border)]
        rounded-2xl p-5">
        <h2 className="font-semibold
          text-[15px] text-[var(--text-main)]
          mb-4">
          🎨 Appearance
        </h2>
        <div className="flex items-center
          justify-between">
          <div>
            <p className="text-[var(--text-main)]
              text-[13px] font-medium">
              Theme
            </p>
            <p className="text-[var(--text-muted)]
              text-[12px]">
              Switch between dark and light mode
            </p>
          </div>
          <button
            onClick={() => {
              document.documentElement
                .classList.toggle('dark')
              const isDark =
                document.documentElement
                .classList.contains('dark')
              localStorage.setItem(
                'linksphereai_theme',
                isDark ? 'dark' : 'light'
              )
            }}
            className="px-4 py-2 rounded-xl
              text-[13px] font-medium
              border border-[var(--border)]
              text-[var(--text-main)]
              hover:border-[#6C63FF]
              transition">
            🌙 / ☀️ Toggle
          </button>
        </div>
      </div>

      {/* ── ABOUT ── */}
      <div className="bg-[var(--bg-card)]
        border border-[var(--border)]
        rounded-2xl p-5">
        <h2 className="font-semibold
          text-[15px] text-[var(--text-main)]
          mb-4">
          ℹ️ About LinkSphereAI
        </h2>
        <div className="flex flex-col gap-2
          text-[13px]">
          <div className="flex justify-between">
            <span className="text-[var(--text-muted)]">
              Version
            </span>
            <span className="text-[var(--text-main)]
              font-medium">
              v1.0.0
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--text-muted)]">
              Built for
            </span>
            <span className="text-[var(--text-main)]
              font-medium">
              CodeAlpha Internship
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--text-muted)]">
              Stack
            </span>
            <span className="text-[var(--text-main)]
              font-medium">
              MERN + Socket.io
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--text-muted)]">
              Developer
            </span>
            <span className="text-[#6C63FF]
              font-medium">
              {user?.name}
            </span>
          </div>
        </div>
      </div>

      {/* ── LOGOUT ── */}
      <div className="bg-[var(--bg-card)]
        border border-[var(--border)]
        rounded-2xl p-5">
        <h2 className="font-semibold
          text-[15px] text-[var(--text-main)]
          mb-2">
          🚪 Session
        </h2>
        <p className="text-[var(--text-muted)]
          text-[12px] mb-4">
          Logged in as @{user?.username}
        </p>
        <button
          onClick={() => {
            logout()
            navigate('/login')
          }}
          className="w-full py-2.5 rounded-xl
            text-[13px] font-medium
            border border-[var(--border)]
            text-[var(--text-main)]
            hover:border-red-400
            hover:text-red-400 transition">
          Logout
        </button>
      </div>

      {/* ── DANGER ZONE ── */}
      <div className="bg-red-500/5
        border border-red-500/20
        rounded-2xl p-5">
        <h2 className="font-semibold
          text-[15px] text-red-400 mb-1">
          ⚠️ Danger Zone
        </h2>
        <p className="text-[var(--text-muted)]
          text-[12px] mb-4">
          Deleting your account is permanent
          and cannot be undone.
        </p>

        {!showDeleteConfirm ? (
          <button
            onClick={() =>
              setShowDeleteConfirm(true)}
            className="px-5 py-2.5 rounded-xl
              text-[13px] font-semibold
              bg-red-500 text-white
              hover:bg-red-600 transition">
            Delete My Account
          </button>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-[var(--text-muted)]
              text-[12px]">
              Type your username
              <span className="text-red-400
                font-semibold mx-1">
                @{user?.username}
              </span>
              to confirm deletion:
            </p>
            <input
              value={deleteInput}
              onChange={e =>
                setDeleteInput(e.target.value)}
              placeholder={user?.username}
              className="w-full bg-[var(--bg-input)]
                border border-red-500/30
                rounded-xl px-4 py-2.5
                text-[var(--text-main)] text-[13px]
                focus:border-red-500 outline-none"
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false)
                  setDeleteInput('')
                }}
                className="flex-1 py-2.5
                  rounded-xl text-[13px]
                  border border-[var(--border)]
                  text-[var(--text-muted)]
                  hover:border-[#6C63FF]
                  transition">
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={
                  deleting ||
                  deleteInput !== user?.username
                }
                className="flex-1 py-2.5
                  rounded-xl text-[13px]
                  font-semibold bg-red-500
                  text-white hover:bg-red-600
                  disabled:opacity-40 transition">
                {deleting
                  ? 'Deleting...'
                  : 'Confirm Delete'}
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}

export default Settings
