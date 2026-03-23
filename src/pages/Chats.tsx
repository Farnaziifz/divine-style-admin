
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCheck,
  Filter,
  Image as ImageIcon,
  Loader2,
  MessagesSquare,
  Mic,
  MoreVertical,
  Paperclip,
  Pause,
  Play,
  Plus,
  Send,
  Smile,
  Trash2,
  UserCircle2,
} from 'lucide-react';
import { SearchInput } from '../components/common/SearchInput';
import { getImageUrl } from '../utils/image';
import {
  directChatService,
  type DirectConversationListItem,
  type DirectMessage,
} from '../services/directChat.service';

const formatTime = (value: string) => {
  try {
    return new Intl.DateTimeFormat('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  } catch {
    return value;
  }
};

const fileTypeToAttachmentType = (file: File): 'IMAGE' | 'AUDIO' | null => {
  if (file.type.startsWith('image/')) return 'IMAGE';
  if (file.type.startsWith('audio/')) return 'AUDIO';
  return null;
};

const formatDuration = (seconds: number) => {
  const mm = Math.floor(seconds / 60);
  const ss = seconds % 60;
  return `${mm}:${String(ss).padStart(2, '0')}`;
};

const voiceWave = (seed: string, bars = 35) => {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const values: number[] = [];
  for (let i = 0; i < bars; i += 1) {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    const v = (h >>> 0) % 100;
    const height = 8 + Math.floor((v / 100) * 20);
    values.push(height);
  }
  return values;
};

const Chats = () => {
  const [q, setQ] = useState('');
  const [conversations, setConversations] = useState<DirectConversationListItem[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const endRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const shouldAutoScrollRef = useRef(true);
  const recordingStartedAtRef = useRef<number | null>(null);
  const recordingTimerRef = useRef<number | null>(null);
  const discardRecordingRef = useRef(false);
  const recordingConversationIdRef = useRef<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioMessageIdRef = useRef<string | null>(null);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [audioProgress, setAudioProgress] = useState(0);
  const [voiceDurationById, setVoiceDurationById] = useState<Record<string, number>>({});

  const currentRole = useMemo(() => {
    try {
      const raw = localStorage.getItem('user');
      const parsed = raw ? (JSON.parse(raw) as { role?: string; permissions?: string[] }) : null;
      return {
        role: parsed?.role ?? null,
        permissions: Array.isArray(parsed?.permissions) ? parsed?.permissions : [],
      };
    } catch {
      return { role: null, permissions: [] as string[] };
    }
  }, []);

  const canManage =
    currentRole.role === 'ADMIN' ||
    (currentRole.role === 'OPERATOR' && currentRole.permissions.includes('CHAT_MANAGE'));

  const fetchConversations = useCallback(async () => {
    setLoadingList(true);
    try {
      const list = await directChatService.listConversations({
        ...(q.trim() ? { q: q.trim() } : {}),
      });
      setConversations(list);
      if (!selectedConversationId && list[0]?.id) {
        setSelectedConversationId(list[0].id);
      }
    } finally {
      setLoadingList(false);
    }
  }, [q, selectedConversationId]);

  const fetchMessages = useCallback(async (params: {
    conversationId: string;
    since?: string;
    silent?: boolean;
  }) => {
    if (!params.silent) setLoadingMessages(true);
    try {
      const res = await directChatService.listMessages(params.conversationId, {
        ...(params.since ? { since: params.since } : {}),
      });
      setMessages((prev) =>
        params.since ? [...prev, ...res.messages] : res.messages,
      );
    } finally {
      if (!params.silent) setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    if (!canManage) return;
    fetchConversations();
  }, [canManage, fetchConversations]);

  useEffect(() => {
    if (!canManage) return;
    const t = window.setInterval(() => {
      fetchConversations();
    }, 60_000);
    return () => window.clearInterval(t);
  }, [canManage, fetchConversations]);

  useEffect(() => {
    if (!canManage) return;
    if (!selectedConversationId) return;
    setMessages([]);
    fetchMessages({ conversationId: selectedConversationId });
    directChatService.markRead(selectedConversationId).catch(() => {});
  }, [canManage, fetchMessages, selectedConversationId]);

  useEffect(() => {
    if (!canManage) return;
    if (!selectedConversationId) return;
    const t = window.setInterval(() => {
      const last = messages[messages.length - 1];
      fetchMessages({
        conversationId: selectedConversationId,
        since: last?.createdAt,
        silent: true,
      }).catch(() => {});
    }, 60_000);
    return () => window.clearInterval(t);
  }, [canManage, fetchMessages, messages, selectedConversationId]);

  useEffect(() => {
    if (!shouldAutoScrollRef.current) return;
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, selectedConversationId]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    audioMessageIdRef.current = null;
    setPlayingMessageId(null);
    setAudioProgress(0);
  }, [selectedConversationId]);

  useEffect(() => {
    return () => {
      const audio = audioRef.current;
      if (!audio) return;
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const audioMessages = messages.filter((m) => m.attachmentType === 'AUDIO' && m.attachmentUrl);
    const missing = audioMessages.filter((m) => voiceDurationById[m.id] == null);
    if (missing.length === 0) return;
    missing.forEach((m) => {
      if (!m.attachmentUrl) return;
      const a = new Audio(getImageUrl(m.attachmentUrl));
      a.preload = 'metadata';
      const onLoaded = () => {
        const d = Number.isFinite(a.duration) ? Math.max(0, Math.floor(a.duration)) : 0;
        setVoiceDurationById((prev) => (prev[m.id] != null ? prev : { ...prev, [m.id]: d }));
        a.removeEventListener('loadedmetadata', onLoaded);
      };
      a.addEventListener('loadedmetadata', onLoaded);
    });
  }, [messages, voiceDurationById]);

  const stopRecordingTimer = () => {
    if (recordingTimerRef.current) {
      window.clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    recordingStartedAtRef.current = null;
    setRecordingSeconds(0);
  };

  const startRecording = async () => {
    if (isRecording) return;
    if (!selectedConversationId) return;
    discardRecordingRef.current = false;
    recordingConversationIdRef.current = selectedConversationId;
    setRecordingSeconds(0);
    recordingStartedAtRef.current = Date.now();
    if (recordingTimerRef.current) {
      window.clearInterval(recordingTimerRef.current);
    }
    recordingTimerRef.current = window.setInterval(() => {
      const startedAt = recordingStartedAtRef.current;
      if (!startedAt) return;
      const seconds = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
      setRecordingSeconds(seconds);
    }, 250);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stopRecordingTimer();
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        });
        chunksRef.current = [];
        setIsRecording(false);
        if (discardRecordingRef.current) return;
        const conversationId = recordingConversationIdRef.current;
        recordingConversationIdRef.current = null;
        if (!conversationId) return;
        if (blob.size === 0) return;
        const file = new File([blob], `voice-${Date.now()}.webm`, {
          type: blob.type,
        });
        setSending(true);
        try {
          const created = await directChatService.sendMessage(conversationId, {
            file,
            attachmentType: 'AUDIO',
          });
          shouldAutoScrollRef.current = true;
          setMessages((prev) => [...prev, created]);
        } finally {
          setSending(false);
        }
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch {
      stopRecordingTimer();
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    const r = mediaRecorderRef.current;
    if (!r) return;
    if (r.state === 'inactive') return;
    if (recordingTimerRef.current) {
      window.clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    r.stop();
  };

  const cancelRecording = () => {
    if (!isRecording) return;
    discardRecordingRef.current = true;
    stopRecording();
    stopRecordingTimer();
    setIsRecording(false);
  };

  const toggleVoicePlayback = async (params: { messageId: string; url: string }) => {
    const ensureAudio = () => {
      if (!audioRef.current) {
        const a = new Audio();
        a.preload = 'auto';
        a.addEventListener('timeupdate', () => {
          const duration = a.duration || 0;
          if (!duration) return;
          setAudioProgress(a.currentTime / duration);
        });
        a.addEventListener('ended', () => {
          setPlayingMessageId(null);
          setAudioProgress(0);
          audioMessageIdRef.current = null;
        });
        a.addEventListener('loadedmetadata', () => {
          const currentId = audioMessageIdRef.current;
          if (!currentId) return;
          const d = Number.isFinite(a.duration) ? Math.max(0, Math.floor(a.duration)) : 0;
          setVoiceDurationById((prev) => (prev[currentId] != null ? prev : { ...prev, [currentId]: d }));
        });
        audioRef.current = a;
      }
      return audioRef.current;
    };

    const audio = ensureAudio();
    if (audioMessageIdRef.current !== params.messageId) {
      audio.pause();
      audio.src = params.url;
      audio.currentTime = 0;
      audioMessageIdRef.current = params.messageId;
      setAudioProgress(0);
    }

    if (audio.paused) {
      try {
        await audio.play();
        setPlayingMessageId(params.messageId);
      } catch {
        setPlayingMessageId(null);
      }
    } else {
      audio.pause();
      setPlayingMessageId(null);
    }
  };

  const seekVoice = (params: { messageId: string; url: string; percent: number }) => {
    if (!audioRef.current) return;
    if (audioMessageIdRef.current !== params.messageId) return;
    const audio = audioRef.current;
    const duration = audio.duration || 0;
    if (!duration) return;
    const p = Math.min(1, Math.max(0, params.percent));
    audio.currentTime = p * duration;
    setAudioProgress(p);
  };

  const selected = conversations.find((c) => c.id === selectedConversationId) ?? null;
  const selectedTitle = selected
    ? `${selected.user.name || ''} ${selected.user.lastName || ''}`.trim() ||
      selected.user.mobile
    : 'گفتگو';

  if (!canManage) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <p className="text-gray-600">شما به گفتگوها دسترسی ندارید.</p>
      </div>
    );
  }

  return (
    <div dir="rtl" className="h-[calc(100dvh-7rem)] rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="h-full flex flex-col lg:flex-row">
        <aside className="h-full w-full lg:w-[360px] border-l border-gray-100 bg-white">
          <div className="h-14 px-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessagesSquare size={18} className="text-gray-700" />
              <div className="font-bold text-gray-800">پیام‌ها</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="w-9 h-9 rounded-full bg-[#2E69FF] text-white flex items-center justify-center"
                aria-label="new-chat"
              >
                <Plus size={18} />
              </button>
              <button
                type="button"
                className="w-9 h-9 rounded-full border border-gray-200 text-gray-600 flex items-center justify-center hover:bg-gray-50"
                aria-label="filter"
              >
                <Filter size={18} />
              </button>
            </div>
          </div>

          <div className="p-4 border-b border-gray-100">
            <SearchInput onSearch={(value) => setQ(value)} placeholder="جستجوی نام کاربر..." />
          </div>

          <div className="h-[calc(100%-112px)] overflow-y-auto">
            {loadingList ? (
              <div className="flex items-center justify-center text-gray-500 mt-10">
                <Loader2 className="animate-spin" size={20} />
                <span className="ms-2 text-sm">در حال دریافت...</span>
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-6 text-sm text-gray-500">گفتگویی یافت نشد.</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {conversations.map((c) => {
                  const isActive = c.id === selectedConversationId;
                  const fullName = `${c.user.name || ''} ${c.user.lastName || ''}`.trim();
                  const title = fullName || c.user.mobile;
                  const preview = c.lastMessage?.text
                    ? c.lastMessage.text
                    : c.lastMessage?.attachmentType === 'IMAGE'
                      ? 'تصویر'
                      : c.lastMessage?.attachmentType === 'AUDIO'
                        ? 'ویس'
                        : '';
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedConversationId(c.id)}
                      className={`w-full text-start p-4 transition-colors ${
                        isActive ? 'bg-[#E8F1FF]' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-11 h-11 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center shrink-0">
                          <UserCircle2 size={22} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <div className="font-bold text-gray-800 truncate">
                              {title}
                            </div>
                            <div className="text-[11px] text-gray-400 whitespace-nowrap flex items-center gap-1">
                              <CheckCheck size={14} className="text-[#2E69FF]" />
                              {c.lastMessage?.createdAt
                                ? formatTime(c.lastMessage.createdAt)
                                : formatTime(c.updatedAt)}
                            </div>
                          </div>
                          {preview ? (
                            <div className="mt-1 text-xs text-gray-500 truncate">
                              {preview}
                            </div>
                          ) : (
                            <div className="mt-1 text-xs text-gray-400 truncate">
                              {c.user.mobile}
                            </div>
                          )}
                          {c.unreadCount > 0 ? (
                            <div className="mt-2 inline-flex items-center justify-center text-[11px] text-white bg-zafting-accent px-2 py-1 rounded-full">
                              {c.unreadCount}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        <div className="h-full flex-1 flex flex-col bg-[#F8F9FB]">
          <div className="h-14 px-4 border-b border-gray-100 bg-white flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center">
                <UserCircle2 size={22} />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-gray-800 truncate">{selectedTitle}</div>
                <div className="text-xs text-gray-400 truncate">
                  {selected?.user.mobile || '—'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-gray-500">
              <button
                type="button"
                className="p-2 rounded-xl hover:bg-gray-50 border border-gray-100"
                aria-label="more"
              >
                <MoreVertical size={18} />
              </button>
            </div>
          </div>

          <div
            ref={scrollRef}
            onScroll={() => {
              const el = scrollRef.current;
              if (!el) return;
              const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
              shouldAutoScrollRef.current = distanceToBottom < 160;
            }}
            className="flex-1 overflow-y-auto px-4 py-6"
          >
            {loadingMessages && messages.length === 0 ? (
              <div className="flex items-center justify-center text-gray-500 mt-10">
                <Loader2 className="animate-spin" size={20} />
                <span className="ms-2 text-sm">در حال دریافت...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((m) => {
                  const isMine = m.authorRole !== 'USER';
                  const audioUrl =
                    m.attachmentType === 'AUDIO' && m.attachmentUrl
                      ? getImageUrl(m.attachmentUrl)
                      : null;
                  const isVoice = !!audioUrl && m.attachmentType === 'AUDIO';
                  const bubble = isMine
                    ? isVoice ? 'bg-zafting-accent text-white' : 'bg-zafting-accent text-white'
                    : 'bg-white text-gray-800 border border-gray-100';
                  const align = isMine ? 'justify-end' : 'justify-start';
                  const corner = isMine ? 'rounded-2xl rounded-br-sm' : 'rounded-2xl rounded-bl-sm';
                  const isPlaying = playingMessageId === m.id;
                  const durationSeconds = voiceDurationById[m.id] ?? 0;
                  return (
                    <div key={m.id} className={`flex w-full my-2 ${align}`}>
                      <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} max-w-[85%]`}>
                        <div className={`${corner} px-4 py-3 shadow-sm ${bubble}`}>
                          {m.attachmentType === 'IMAGE' && m.attachmentUrl ? (
                            <img
                              src={getImageUrl(m.attachmentUrl)}
                              alt="attachment"
                              className="w-full max-w-xs rounded-xl mb-2"
                            />
                          ) : null}
                          {isVoice ? (
                            <div className="w-[240px] sm:w-[280px]" dir="ltr">
                              <div className="flex items-center gap-3">
                                <button
                                  type="button"
                                  onClick={() => toggleVoicePlayback({ messageId: m.id, url: audioUrl })}
                                  className={`w-12 h-12 shrink-0 rounded-full flex items-center justify-center ${
                                    isMine
                                      ? 'bg-white text-zafting-accent'
                                      : 'bg-zafting-accent text-white'
                                  }`}
                                  aria-label={isPlaying ? 'pause' : 'play'}
                                >
                                  {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} className="ms-[2px]" fill="currentColor" />}
                                </button>

                                <div
                                  role="button"
                                  tabIndex={0}
                                  onClick={(e) => {
                                    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                                    const x = e.clientX - rect.left;
                                    const percent = rect.width ? x / rect.width : 0;
                                    seekVoice({ messageId: m.id, url: audioUrl, percent });
                                  }}
                                  onKeyDown={() => {}}
                                  className="relative flex-1 h-10 flex items-center cursor-pointer"
                                >
                                  <div className="flex items-center w-full gap-[2px]">
                                    {voiceWave(m.id, 35).map((h, idx) => {
                                      const isPlayed = (idx / 35) <= (audioMessageIdRef.current === m.id ? audioProgress : 0);
                                      return (
                                        <span
                                          key={idx}
                                          className={`w-[3px] rounded-full transition-colors ${
                                            isMine
                                              ? isPlayed ? 'bg-white' : 'bg-white/40'
                                              : isPlayed ? 'bg-zafting-accent' : 'bg-zafting-accent/40'
                                          }`}
                                          style={{ height: `${h}px` }}
                                        />
                                      );
                                    })}
                                  </div>
                                </div>

                                <div className={`text-sm tabular-nums shrink-0 ${isMine ? 'text-white' : 'text-gray-600'}`}>
                                  {formatDuration(durationSeconds)}
                                </div>
                              </div>
                            </div>
                          ) : null}
                          {m.text ? (
                            <div className="text-sm leading-7 whitespace-pre-wrap">{m.text}</div>
                          ) : null}
                        </div>
                        <div className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                          <span>{formatTime(m.createdAt)}</span>
                          {isMine && <CheckCheck size={16} className="text-zafting-accent" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={endRef} />
              </div>
            )}
          </div>

          <div className="p-4 border-t border-gray-100 bg-white">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  if (isRecording) stopRecording();
                  else startRecording().catch(() => {});
                }}
                disabled={!selectedConversationId || sending}
                className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  isRecording
                    ? 'bg-zafting-accent text-white'
                    : 'bg-zafting-accent text-white hover:opacity-90'
                } disabled:opacity-60`}
                aria-label="voice"
              >
                {isRecording ? (
                  <span className="relative inline-flex h-5 w-5 items-center justify-center">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-white/35 animate-ping" />
                    <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-white" />
                  </span>
                ) : (
                  <Mic size={18} />
                )}
              </button>

              {isRecording ? (
                <>
                  <div className="flex-1 bg-white border border-gray-200 rounded-full px-4 py-2 flex items-center gap-3 shadow-sm">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 6 }).map((_, idx) => (
                        <span
                          key={idx}
                          className="h-3 w-1.5 rounded-full bg-[#FF6B6B] animate-pulse"
                          style={{ animationDelay: `${idx * 120}ms` }}
                        />
                      ))}
                    </div>
                    <div className="flex-1 h-0 border-t-2 border-dashed border-[#FF6B6B]/60" />
                    <div className="flex items-center gap-2 text-gray-700 tabular-nums">
                      <span>{formatDuration(recordingSeconds)}</span>
                      <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={cancelRecording}
                    className="w-12 h-12 rounded-full border border-red-200 text-red-500 flex items-center justify-center hover:bg-red-50"
                    aria-label="cancel-voice"
                  >
                    <Trash2 size={18} />
                  </button>
                </>
              ) : (
                <div className="flex-1 bg-[#F3F4F6] border border-gray-200 rounded-full px-4 py-2 flex items-center gap-2">
                  <button
                    type="button"
                    className="text-gray-500 hover:text-gray-700"
                    aria-label="emoji"
                  >
                    <Smile size={18} />
                  </button>
                  <label className="text-gray-500 hover:text-gray-700 cursor-pointer">
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*,audio/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        e.target.value = '';
                        if (!file || !selectedConversationId) return;
                        const attachmentType = fileTypeToAttachmentType(file);
                        if (!attachmentType) return;
                        setSending(true);
                        try {
                          const created = await directChatService.sendMessage(
                            selectedConversationId,
                            {
                              file,
                              attachmentType,
                            },
                          );
                          shouldAutoScrollRef.current = true;
                          setMessages((prev) => [...prev, created]);
                        } finally {
                          setSending(false);
                        }
                      }}
                    />
                    <Paperclip size={18} />
                  </label>
                  <label className="text-gray-500 hover:text-gray-700 cursor-pointer">
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        e.target.value = '';
                        if (!file || !selectedConversationId) return;
                        setSending(true);
                        try {
                          const created = await directChatService.sendMessage(
                            selectedConversationId,
                            {
                              file,
                              attachmentType: 'IMAGE',
                            },
                          );
                          shouldAutoScrollRef.current = true;
                          setMessages((prev) => [...prev, created]);
                        } finally {
                          setSending(false);
                        }
                      }}
                    />
                    <ImageIcon size={18} />
                  </label>
                  <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key !== 'Enter') return;
                      if (e.shiftKey) return;
                      e.preventDefault();
                      (async () => {
                        if (!selectedConversationId) return;
                        if (!text.trim()) return;
                        setSending(true);
                        try {
                          const created = await directChatService.sendMessage(
                            selectedConversationId,
                            { text: text.trim() },
                          );
                          shouldAutoScrollRef.current = true;
                          setMessages((prev) => [...prev, created]);
                          setText('');
                        } finally {
                          setSending(false);
                        }
                      })().catch(() => {});
                    }}
                    placeholder="پیامی بنویسید..."
                    className="flex-1 bg-transparent outline-none text-sm text-gray-800 placeholder:text-gray-400"
                  />
                </div>
              )}

              {!isRecording ? (
                <button
                  type="button"
                  disabled={!selectedConversationId || sending || !text.trim()}
                  onClick={async () => {
                    if (!selectedConversationId) return;
                    if (!text.trim()) return;
                    setSending(true);
                    try {
                      const created = await directChatService.sendMessage(
                        selectedConversationId,
                        { text: text.trim() },
                      );
                      shouldAutoScrollRef.current = true;
                      setMessages((prev) => [...prev, created]);
                      setText('');
                    } finally {
                      setSending(false);
                    }
                  }}
                  className="w-12 h-12 rounded-full bg-zafting-accent text-white flex items-center justify-center hover:opacity-90 disabled:opacity-60"
                  aria-label="send"
                >
                  {sending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chats;
