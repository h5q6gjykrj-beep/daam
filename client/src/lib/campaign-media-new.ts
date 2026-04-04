
export async function saveCampaignAttachment(file: File): Promise<CampaignAttachment> {
  if (file.type.startsWith('image/')) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/upload/campaign-image', { method: 'POST', body: formData });
    if (!res.ok) throw new Error('Image upload failed');
    const data = await res.json();
    return {
      id: data.url,
      kind: 'image',
      name: file.name,
      sizeBytes: file.size,
      mime: file.type,
      url: data.url,
    };
  }
  throw new Error('Only images supported via server upload');
}

export async function getCampaignAttachmentBlob(id: string): Promise<Blob | null> {
  if (id.startsWith('http')) {
    try {
      const res = await fetch(id);
      if (!res.ok) return null;
      return await res.blob();
    } catch { return null; }
  }
  return null;
}
