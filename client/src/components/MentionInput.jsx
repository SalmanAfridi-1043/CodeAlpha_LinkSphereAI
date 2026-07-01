import { useState, useEffect, useRef } from "react";
import api from "../api/axios";
import Avatar from "./Avatar";
import Spinner from "./Spinner";

const MentionInput = ({
  value = "",
  onChange,
  placeholder = "What's on your mind?",
  maxRows = 6,
  className = "",
  style = {},
}) => {
  const [text, setText] = useState(value);
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownUsers, setDropdownUsers] = useState([]);
  const [mentionQuery, setMentionQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const textareaRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    setText(value);
  }, [value]);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search users based on query
  useEffect(() => {
    if (!mentionQuery) {
      setDropdownUsers([]);
      return;
    }

    const searchUsers = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/users/search?q=${encodeURIComponent(mentionQuery)}`);
        if (data.success) {
          setDropdownUsers(data.users.slice(0, 5));
          setSelectedIndex(0);
        }
      } catch (err) {
        console.error("Mention search failed:", err);
      } finally {
        setLoading(false);
      }
    };

    const delayDebounce = setTimeout(() => {
      searchUsers();
    }, 200);

    return () => clearTimeout(delayDebounce);
  }, [mentionQuery]);

  const checkMentionTrigger = (val, cursorIdx) => {
    // Get text before cursor
    const textBeforeCursor = val.slice(0, cursorIdx);
    
    // Find the last index of '@'
    const lastAtIdx = textBeforeCursor.lastIndexOf("@");
    
    if (lastAtIdx === -1) {
      setShowDropdown(false);
      setMentionQuery("");
      return;
    }

    // Check if there is space after '@' or if the word triggers mention
    const textAfterAt = textBeforeCursor.slice(lastAtIdx + 1);
    const hasSpaceAfterAt = /\s/.test(textAfterAt);

    // Only trigger if no space in between and preceded by space/newline or start of text
    const charBeforeAt = lastAtIdx > 0 ? textBeforeCursor[lastAtIdx - 1] : "";
    const isValidPrecedingChar = !charBeforeAt || /\s/.test(charBeforeAt);

    if (!hasSpaceAfterAt && isValidPrecedingChar) {
      setShowDropdown(true);
      setMentionQuery(textAfterAt);
    } else {
      setShowDropdown(false);
      setMentionQuery("");
    }
  };

  const handleTextChange = (e) => {
    const val = e.target.value;
    const cursorIdx = e.target.selectionStart;

    setText(val);
    if (onChange) onChange(val);

    checkMentionTrigger(val, cursorIdx);
  };

  const handleSelectUser = (user) => {
    const cursorIdx = textareaRef.current.selectionStart;
    const textBeforeCursor = text.slice(0, cursorIdx);
    const textAfterCursor = text.slice(cursorIdx);
    
    const lastAtIdx = textBeforeCursor.lastIndexOf("@");
    
    // Replace partial mention with full username
    const newTextBefore = textBeforeCursor.slice(0, lastAtIdx) + `@${user.username} `;
    const updatedText = newTextBefore + textAfterCursor;

    setText(updatedText);
    if (onChange) onChange(updatedText);
    
    setShowDropdown(false);
    setMentionQuery("");

    // Put focus back to textarea and place cursor after username + space
    setTimeout(() => {
      textareaRef.current.focus();
      const newCursorPos = newTextBefore.length;
      textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleKeyDown = (e) => {
    if (!showDropdown || dropdownUsers.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % dropdownUsers.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + dropdownUsers.length) % dropdownUsers.length);
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      handleSelectUser(dropdownUsers[selectedIndex]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setShowDropdown(false);
    }
  };

  return (
    <div className="relative w-full flex flex-col select-none">
      <textarea
        ref={textareaRef}
        value={text}
        onChange={handleTextChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`w-full bg-transparent resize-none outline-none focus:ring-0 ${className}`}
        style={style}
      />

      {/* Mention Search Results Dropdown */}
      {showDropdown && (dropdownUsers.length > 0 || loading) && (
        <div
          ref={dropdownRef}
          className="absolute left-0 bottom-full mb-2 w-64 rounded-2xl z-50 overflow-hidden"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-md), 0 0 20px rgba(108, 99, 255, 0.15)",
          }}
        >
          {loading && dropdownUsers.length === 0 ? (
            <div className="flex items-center justify-center p-4">
              <Spinner size="sm" color="var(--primary)" />
            </div>
          ) : (
            <div className="flex flex-col p-1.5 divide-y divide-[var(--border)]/10">
              {dropdownUsers.map((user, idx) => (
                <div
                  key={user._id}
                  onClick={() => handleSelectUser(user)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center gap-2.5 p-2 rounded-xl cursor-pointer transition ${
                    idx === selectedIndex ? "bg-[var(--surface-2)]" : "bg-transparent"
                  }`}
                >
                  <Avatar user={user} size="xs" showOnlineStatus={false} showRing={false} />
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-semibold text-xs truncate leading-tight">
                      {user.name}
                    </p>
                    <p className="text-[var(--muted)] text-[10px] truncate mt-0.5">
                      @{user.username}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MentionInput;
