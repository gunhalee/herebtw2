"use client";

import { CandidateFirstMessagePanel } from "./candidate-first-message-panel";
import { useCandidateFirstMessageEditor } from "./use-candidate-first-message-editor";

export function CandidateFirstMessageSection({
  initialContent,
}: {
  initialContent: string;
}) {
  const editor = useCandidateFirstMessageEditor(initialContent);

  return (
    <CandidateFirstMessagePanel
      content={editor.messageContent}
      editing={editor.editingMessage}
      errorMessage={editor.messageError}
      hasChanges={editor.hasMessageChanges}
      saving={editor.savingMessage}
      onCancel={editor.handleCancelEdit}
      onChangeContent={editor.handleChangeMessageContent}
      onSave={editor.handleSaveMessage}
      onStartEditing={editor.startEditing}
    />
  );
}
