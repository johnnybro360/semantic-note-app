export type EmbeddingStatus = "pending" | "ready" | "failed";

export type Note = {
  id: string;
  title: string;
  body: string;
  embeddingStatus: EmbeddingStatus;
  createdAt: number;
  updatedAt: number;
};

export type CreateNoteInput = {
  title: string;
  body: string;
};

export type UpdateNoteInput = {
  title?: string;
  body?: string;
};
