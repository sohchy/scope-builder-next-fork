import { format } from "date-fns";
import { useAuth } from "@clerk/nextjs";
import { useEffect, useRef, useState } from "react";
import {
  EllipsisIcon,
  FileIcon,
  FileTextIcon,
  MessageCircleIcon,
  PaperclipIcon,
  XIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

import {
  Sheet,
  SheetTitle,
  SheetHeader,
  SheetContent,
  SheetTrigger,
} from "./ui/sheet";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Checkbox } from "./ui/checkbox";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { createNote, deleteNote, getNotes, updateNote } from "@/services/notes";
import { uploadToSupabase } from "@/lib/uploadToSupabase";
import Link from "next/link";

export type Attachment = {
  url: string;
  name: string;
  size?: string;
  type: "image" | "file";
};

type Note = {
  id: number;
  org_id: string;
  author: string;
  user_id: string;
  content: string;
  created_at: string;
  share_with_startup: boolean;
  attachments: Attachment[];
};

export default function Notes() {
  const { userId, orgId, orgRole } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);

  const [text, setText] = useState("");
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [shareWithStartup, setShareWithStartup] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>(
    [],
  );

  useEffect(() => {
    async function fetchNotes() {
      setIsLoading(true);

      const notesData = await getNotes();
      setNotes(
        notesData.map((note) => ({
          id: note.id,
          org_id: note.org_id,
          content: note.content,
          user_id: note.user_id,
          author: note.author_name,
          share_with_startup: note.share_with_startup,
          created_at: format(note.created_at, "MMM d, yyyy h:mm:ss a"),
          attachments: note.attachments as Attachment[],
        })),
      );

      setIsLoading(false);
    }

    fetchNotes();
  }, [orgId, orgRole]);

  const addNote = async () => {
    if (text.trim().length === 0) return;

    try {
      const newNote = await createNote(
        text,
        shareWithStartup,
        pendingAttachments,
      );

      setText("");
      setShareWithStartup(false);
      setNotes((prevNotes) => [
        ...prevNotes,
        {
          id: newNote.id,
          org_id: newNote.org_id,
          content: newNote.content,
          author: newNote.author_name,
          user_id: newNote.user_id,
          share_with_startup: newNote.share_with_startup,
          created_at: format(newNote.created_at, "MMM d, yyyy h:mm:ss a"),
          attachments: newNote.attachments as Attachment[],
        },
      ]);
      setPendingAttachments([]);
    } catch (err) {
      console.error("Error adding note:", err);
    }
  };

  const onDeleteNote = async (noteId: number) => {
    try {
      await deleteNote(noteId);
      setNotes((prevNotes) => prevNotes.filter((note) => note.id !== noteId));
    } catch (err) {
      console.error("Error updating note:", err);
    }
  };

  const onUpdateNote = async (
    noteId: number,
    content: string,
    shareWithStartup: boolean,
  ) => {
    try {
      await updateNote(noteId, content, shareWithStartup);
      setNotes((prevNotes) =>
        prevNotes.map((note) =>
          note.id === noteId
            ? { ...note, content, share_with_startup: shareWithStartup }
            : note,
        ),
      );
    } catch (err) {
      console.error("Error updating note:", err);
    }
  };

  const onUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const filename = file.name;
    const sizeKB = file.size / 1024;
    const isImage = file.type.startsWith("image/");
    const { url, mime } = await uploadToSupabase(file);

    const newAttachment: Attachment = {
      url,
      name: filename,
      type: isImage ? "image" : "file",
      size:
        sizeKB > 1024
          ? `${(sizeKB / 1024).toFixed(1)} MB`
          : `${Math.round(sizeKB)} KB`,
    };

    setPendingAttachments((prev) => [...prev, newAttachment]);
    e.target.value = "";
  };

  const removeAttachment = (index: number) => {
    setPendingAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const canPostNote = orgRole === "org:admin" || orgRole === "org:mentor";

  return (
    <Sheet
      onOpenChange={() => {
        setText("");
        setPendingAttachments([]);
        setShareWithStartup(false);
      }}
    >
      <SheetTrigger asChild>
        <Button size={"icon"} className="cursor-pointer">
          <MessageCircleIcon size={14} />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[450px] min-w-[450px] max-w-none">
        <SheetHeader>
          <SheetTitle>Notes</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col justify-between h-full">
          <div className="flex flex-1 w-full">
            {isLoading ? (
              <EllipsisIcon
                size={40}
                className="text-[#6A35FF] animate-pulse self-center ml-auto mr-auto"
              />
            ) : (
              <div className="flex flex-col gap-4 p-4 overflow-y-auto w-full">
                {notes
                  .filter((note) => {
                    let canUserSeeNote = true;

                    if (note.share_with_startup) canUserSeeNote = true;

                    if (!note.share_with_startup && note.user_id !== userId)
                      canUserSeeNote = false;

                    return canUserSeeNote;
                  })
                  .map((note) => (
                    <ChatNote
                      key={note.id}
                      content={note.content}
                      timestamp={note.created_at}
                      sender={{
                        name: note.author,
                        initials: note.author
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase(),
                      }}
                      attachments={note.attachments}
                      isAuthor={note.user_id === userId}
                      isPublic={note.share_with_startup}
                      onDeleteNote={() => onDeleteNote(note.id)}
                      onUpdateNote={(content, shareWithStartup) =>
                        onUpdateNote(note.id, content, shareWithStartup)
                      }
                    />
                  ))}
              </div>
            )}
          </div>
          {canPostNote && (
            <>
              {pendingAttachments.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto border-t border-border px-4 py-2">
                  {pendingAttachments.map((att, i) => (
                    <div
                      key={`${att.name}-${i}`}
                      className="relative flex items-center gap-1.5 shrink-0 rounded-lg border border-border bg-muted px-2.5 py-1.5"
                    >
                      {att.type === "image" ? (
                        <img
                          src={att.url || "/placeholder.svg"}
                          alt={att.name}
                          className="h-8 w-8 rounded object-cover"
                        />
                      ) : (
                        <FileIcon className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="max-w-[120px] truncate text-xs text-foreground">
                        {att.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeAttachment(i)}
                        className="ml-1 rounded-full p-0.5 hover:bg-accent transition-colors"
                        aria-label={`Remove ${att.name}`}
                      >
                        <XIcon className="h-3 w-3 text-muted-foreground" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex flex-col gap-3 p-3">
                <div className="flex flex-row items-center gap-2">
                  <Textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                  />
                  <Button
                    variant={"ghost"}
                    size={"icon"}
                    onClick={() => inputRef.current?.click()}
                  >
                    <PaperclipIcon size={14} />
                  </Button>
                  <input
                    type="file"
                    className="hidden"
                    ref={inputRef}
                    onChange={onUploadFile}
                  />
                </div>
                <div className="flex flex-row gap-2 items-center">
                  <Checkbox
                    id="share"
                    checked={shareWithStartup}
                    onCheckedChange={() =>
                      setShareWithStartup(!shareWithStartup)
                    }
                  />
                  <Label htmlFor="share">Share with startup</Label>
                </div>
                <Button onClick={addNote}>Add Note</Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function ImageAttachment({ attachment }: { attachment: Attachment }) {
  return (
    <Link
      href={attachment.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block overflow-hidden rounded-lg"
    >
      <img
        src={attachment.url || "/placeholder.svg"}
        alt={attachment.name}
        className="h-40 w-full max-w-[240px] object-cover transition-opacity group-hover:opacity-90"
      />
      <div className="absolute inset-x-0 bottom-0 bg-black/40 px-2 py-1 text-[11px] text-white opacity-0 transition-opacity group-hover:opacity-100">
        {attachment.name}
      </div>
    </Link>
  );
}

function FileAttachment({
  attachment,
  isCurrentUser,
}: {
  attachment: Attachment;
  isCurrentUser: boolean;
}) {
  return (
    <Link
      href={attachment.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "flex items-center gap-2 rounded-lg border px-3 py-2 transition-colors text-white no-underline",
        isCurrentUser
          ? "border-primary-foreground/20 hover:bg-primary-foreground/10"
          : "border-border hover:bg-accent",
      )}
    >
      <FileTextIcon className="h-4 w-4 shrink-0 opacity-70" />
      <div className="flex flex-col min-w-0">
        <span className="truncate text-xs font-medium">{attachment.name}</span>
        {attachment.size && (
          <span className="text-[10px] opacity-60">{attachment.size}</span>
        )}
      </div>
    </Link>
  );
}

interface ChatNoteProps {
  content: string;
  timestamp: string;
  isPublic: boolean;
  isAuthor: boolean;
  sender: {
    name: string;
    avatar?: string;
    initials: string;
  };
  attachments: Attachment[];
  onDeleteNote: () => Promise<void>;
  onUpdateNote: (content: string, shareWithStartup: boolean) => Promise<void>;
}

export function ChatNote({
  sender,
  content,
  isAuthor,
  isPublic,
  timestamp,
  attachments,
  onDeleteNote,
  onUpdateNote,
}: ChatNoteProps) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(content);
  const [shareWithStartup, setShareWithStartup] = useState(isPublic);

  const hasAttachments = attachments && attachments.length > 0;
  const files = attachments?.filter((a) => a.type === "file") ?? [];
  const images = attachments?.filter((a) => a.type === "image") ?? [];

  const onUpdate = async () => {
    await onUpdateNote(text, shareWithStartup);
    setOpen(false);
  };

  const onDelete = async () => {
    await onDeleteNote();
    setOpen(false);
  };

  return (
    <div
      className={cn("flex items-end gap-2 max-w-[85%] relative group", {
        "ml-auto flex-row-reverse": isAuthor,
      })}
    >
      {isAuthor && (
        <div className="absolute top-0 size-7">
          <Sheet
            open={open}
            onOpenChange={() => {
              setOpen(!open);
              setText(content);
              setShareWithStartup(isPublic);
            }}
          >
            <SheetTrigger className="invisible group-hover:visible" asChild>
              <Button variant={"ghost"} size={"icon"} className="size-7">
                <EllipsisIcon size={14} />
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[450px] min-w-[450px] max-w-none">
              <SheetHeader>
                <SheetTitle>Update/Remove Note</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-3 p-3">
                <Textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
                <div className="flex flex-row gap-2 items-center">
                  <Checkbox
                    id="share"
                    checked={shareWithStartup}
                    onCheckedChange={() =>
                      setShareWithStartup(!shareWithStartup)
                    }
                  />
                  <Label htmlFor="share">Share with startup</Label>
                </div>

                <div className="flex flex-row items-center justify-end gap-1.5">
                  <Button onClick={onUpdate}>Update</Button>
                  <Button onClick={onDelete} variant={"destructive"}>
                    Delete
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      )}
      <Avatar className="h-8 w-8 shrink-0">
        {sender.avatar && (
          <AvatarImage
            src={sender.avatar || "/placeholder.svg"}
            alt={sender.name}
          />
        )}
        <AvatarFallback className="text-xs">{sender.initials}</AvatarFallback>
      </Avatar>

      <div
        className={cn("flex flex-col gap-1", {
          "items-end": isAuthor,
          "items-start": !isAuthor,
        })}
      >
        <span className="text-xs text-muted-foreground px-1">
          {sender.name}
        </span>
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm leading-relaxed max-w-prose",
            isAuthor
              ? "bg-primary text-primary-foreground rounded-br-md"
              : "bg-muted text-foreground rounded-bl-md",
            hasAttachments ? "pb-2.5" : "",
          )}
        >
          {images.length > 0 && (
            <div
              className={cn(
                "grid gap-1",
                images.length === 1 && "grid-cols-1",
                images.length === 2 && "grid-cols-2",
                images.length >= 3 && "grid-cols-2",
              )}
            >
              {images.map((img) => (
                <ImageAttachment key={img.url} attachment={img} />
              ))}
            </div>
          )}

          {content && (
            <div
              className={cn(
                "px-4",
                images.length > 0 ? "pt-2" : "pt-2.5",
                files.length > 0 ? "pb-1.5" : "pb-2.5",
              )}
            >
              {content}
            </div>
          )}

          {files.length > 0 && (
            <div className="flex flex-col gap-1.5 px-2.5">
              {files.map((file) => (
                <FileAttachment
                  key={file.url}
                  attachment={file}
                  isCurrentUser={isAuthor}
                />
              ))}
            </div>
          )}
        </div>
        <span className="text-[11px] text-muted-foreground px-1 flex flex-row gap-1.5 items-center">
          {timestamp}
          {isPublic && (
            <span className="font-semibold text-[#6A35FF]">public</span>
          )}
        </span>
      </div>
    </div>
  );
}
