import { useState, useEffect } from 'react';
import { X, FileText, ClipboardList, Image as ImageIcon, Video, Eye, Download, ArrowLeft, ExternalLink } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useDaamStore } from '@/hooks/use-daam-store';
import type { Campaign } from '@/types/campaign';
import { getCampaignMedia, getCampaignAttachmentBlob } from '@/lib/campaign-media';
import { trackClick } from '@/lib/campaign-tracking';

interface CampaignModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign: Campaign;
}

const translations = {
  ar: {
    close: 'إغلاق',
    preview: 'معاينة',
    download: 'تحميل',
    takeSurvey: 'المشاركة في الاستبيان',
    images: 'الصور',
    video: 'الفيديو',
    files: 'الملفات',
    survey: 'استبيان',
    noContent: 'لا يوجد محتوى',
    loading: 'جاري التحميل...',
    preparing: 'جاري تجهيز المعاينة...',
    backToList: 'العودة للقائمة',
  },
  en: {
    close: 'Close',
    preview: 'Preview',
    download: 'Download',
    takeSurvey: 'Take Survey',
    images: 'Images',
    video: 'Video',
    files: 'Files',
    survey: 'Survey',
    noContent: 'No content',
    loading: 'Loading...',
    preparing: 'Preparing preview...',
    backToList: 'Back to list',
  }
};

export function CampaignModal({ open, onOpenChange, campaign }: CampaignModalProps) {
  const { lang } = useDaamStore();
  const t = translations[lang];
  const isRTL = lang === 'ar';

  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [imageUrls, setImageUrls] = useState<Map<string, string>>(new Map());
  const [fileUrls, setFileUrls] = useState<Map<string, string>>(new Map());
  const [previewImage, setPreviewImage] = useState<{ url: string; name: string } | null>(null);
  const [activePdfId, setActivePdfId] = useState<string | null>(null);

  const title = lang === 'ar' ? campaign.title.ar : campaign.title.en;
  const content = lang === 'ar' ? campaign.content.ar : campaign.content.en;

  const images = campaign.attachments?.filter(a => a.kind === 'image') || [];
  const videos = campaign.attachments?.filter(a => a.kind === 'video') || [];
  const files = campaign.attachments?.filter(a => a.kind === 'file') || [];

  // Check for legacy video format
  const hasLegacyVideo = !videos.length && campaign.video?.id;

  // Load video URL (supports both legacy and new attachment format)
  useEffect(() => {
    if (!open) return;

    const loadVideo = async () => {
      let videoId: string | undefined;
      
      if (videos.length > 0) {
        videoId = videos[0].id;
      } else if (hasLegacyVideo) {
        videoId = campaign.video?.id;
      }

      if (videoId) {
        const blob = await getCampaignMedia(videoId);
        if (blob) {
          const url = URL.createObjectURL(blob);
          setVideoUrl(url);
        }
      }
    };

    loadVideo();

    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
        setVideoUrl(null);
      }
    };
  }, [open, videos, hasLegacyVideo, campaign.video?.id]);

  // Load image URLs with proper MIME type
  useEffect(() => {
    if (!open || images.length === 0) return;

    const loadImages = async () => {
      const urls = new Map<string, string>();
      
      for (const img of images) {
        const blob = await getCampaignAttachmentBlob(img.id);
        if (blob) {
          // Detect MIME type from filename or use blob type
          let mimeType = blob.type;
          if (!mimeType || mimeType === 'application/octet-stream') {
            const ext = img.name.toLowerCase().split('.').pop();
            if (ext === 'png') mimeType = 'image/png';
            else if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';
            else if (ext === 'webp') mimeType = 'image/webp';
            else if (ext === 'gif') mimeType = 'image/gif';
            else mimeType = 'image/png'; // fallback
          }
          // Create new blob with correct MIME type
          const typedBlob = new Blob([blob], { type: mimeType });
          urls.set(img.id, URL.createObjectURL(typedBlob));
        }
      }
      
      setImageUrls(urls);
    };

    loadImages();

    return () => {
      imageUrls.forEach(url => URL.revokeObjectURL(url));
      setImageUrls(new Map());
    };
  }, [open, images.length]);

  // Load file URLs (PDFs) with proper MIME type
  useEffect(() => {
    if (!open || files.length === 0) return;

    const loadFiles = async () => {
      const urls = new Map<string, string>();
      
      for (const file of files) {
        const blob = await getCampaignAttachmentBlob(file.id);
        if (blob) {
          // Ensure PDF has correct MIME type for iframe rendering
          const pdfBlob = blob.type ? blob : new Blob([blob], { type: 'application/pdf' });
          urls.set(file.id, URL.createObjectURL(pdfBlob));
        }
      }
      
      setFileUrls(urls);
    };

    loadFiles();

    return () => {
      fileUrls.forEach(url => URL.revokeObjectURL(url));
      setFileUrls(new Map());
      setActivePdfId(null);
    };
  }, [open, files.length]);

  const surveyLabel = campaign.survey?.label 
    ? (lang === 'ar' ? campaign.survey.label.ar : campaign.survey.label.en)
    : t.takeSurvey;

  const hasAnyContent = images.length > 0 || videos.length > 0 || hasLegacyVideo || files.length > 0 || campaign.survey?.url;

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-2xl max-h-[85vh] overflow-y-auto"
        dir={isRTL ? 'rtl' : 'ltr'}
        data-testid="campaign-modal"
      >
        <DialogHeader>
          <DialogTitle className="text-xl" data-testid="campaign-modal-title">
            {title || (lang === 'ar' ? 'حملة' : 'Campaign')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {content && (
            <p className="text-muted-foreground whitespace-pre-wrap" data-testid="campaign-modal-content">
              {content}
            </p>
          )}

          {(videoUrl || hasLegacyVideo || videos.length > 0) && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Video className="w-4 h-4" />
                {t.video}
              </div>
              {videoUrl ? (
                <video
                  src={videoUrl}
                  controls
                  muted
                  className="w-full max-h-64 rounded-lg bg-black"
                  data-testid="campaign-modal-video"
                />
              ) : (
                <div className="h-32 flex items-center justify-center bg-muted rounded-lg">
                  <span className="text-muted-foreground text-sm">{t.loading}</span>
                </div>
              )}
            </div>
          )}

          {images.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <ImageIcon className="w-4 h-4" />
                {t.images} ({images.length})
              </div>
              <div className="grid grid-cols-3 gap-2">
                {images.map((img) => (
                  <button
                    key={img.id}
                    type="button"
                    className="aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                    onClick={() => {
                      const url = imageUrls.get(img.id);
                      if (url) {
                        trackClick(campaign.id);
                        setPreviewImage({ url, name: img.name });
                      }
                    }}
                    data-testid={`button-preview-image-${img.id}`}
                  >
                    {imageUrls.get(img.id) ? (
                      <img
                        src={imageUrls.get(img.id)}
                        alt={img.name}
                        className="w-full h-full object-cover"
                        data-testid={`campaign-modal-image-${img.id}`}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-muted-foreground text-xs">{t.loading}</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {files.length > 0 && !activePdfId && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <FileText className="w-4 h-4" />
                {t.files} ({files.length})
              </div>
              <div className="space-y-2">
                {files.map((file) => {
                  const fileUrl = fileUrls.get(file.id);
                  return (
                    <div 
                      key={file.id}
                      className="flex items-center justify-between gap-3 p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-5 h-5 text-red-500 flex-shrink-0" />
                        <span className="text-sm truncate">{file.name}</span>
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          ({(file.sizeBytes / 1024).toFixed(0)} KB)
                        </span>
                      </div>
                      {fileUrl ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            trackClick(campaign.id);
                            setActivePdfId(file.id);
                          }}
                          data-testid={`button-preview-file-${file.id}`}
                        >
                          <Eye className="w-4 h-4 ltr:mr-1 rtl:ml-1" />
                          {t.preview}
                        </Button>
                      ) : (
                        <span className="text-sm text-muted-foreground animate-pulse">{t.preparing}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activePdfId && (() => {
            const activeFile = files.find(f => f.id === activePdfId);
            const pdfUrl = fileUrls.get(activePdfId);
            
            if (!activeFile) return null;
            
            return (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2 p-2 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <span className="text-sm font-medium truncate">{activeFile.name}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {pdfUrl && (
                      <a
                        href={pdfUrl}
                        download={activeFile.name}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium border rounded bg-background hover:bg-muted transition-colors"
                        data-testid="link-download-pdf"
                      >
                        <Download className="w-3 h-3" />
                        {t.download}
                      </a>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setActivePdfId(null)}
                      data-testid="button-back-to-files"
                    >
                      <ArrowLeft className="w-4 h-4 ltr:mr-1 rtl:ml-1 rtl:rotate-180" />
                      {t.backToList}
                    </Button>
                  </div>
                </div>
                
                {pdfUrl ? (
                  <iframe
                    src={pdfUrl}
                    className="w-full h-[70vh] rounded-lg border bg-white"
                    title={activeFile.name}
                    data-testid="pdf-viewer-iframe"
                  />
                ) : (
                  <div className="w-full h-[70vh] rounded-lg border bg-muted flex items-center justify-center">
                    <span className="text-muted-foreground animate-pulse">{t.preparing}</span>
                  </div>
                )}
              </div>
            );
          })()}

          {campaign.survey?.url && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <ClipboardList className="w-4 h-4" />
                {t.survey}
              </div>
              <a
                href={campaign.survey.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackClick(campaign.id)}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                data-testid="link-take-survey"
              >
                <ExternalLink className="w-4 h-4" />
                {surveyLabel}
              </a>
            </div>
          )}

          {!hasAnyContent && !content && (
            <p className="text-center text-muted-foreground py-8">{t.noContent}</p>
          )}
        </div>

        <div className="flex justify-end mt-4">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            data-testid="button-close-modal"
          >
            <X className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
            {t.close}
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    {/* Image Preview Dialog */}
    <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
      <DialogContent 
        className="max-w-4xl p-4"
        dir={isRTL ? 'rtl' : 'ltr'}
        data-testid="image-preview-dialog"
      >
        <DialogHeader>
          <DialogTitle className="text-base truncate">
            {previewImage?.name}
          </DialogTitle>
        </DialogHeader>
        
        {previewImage && (
          <div className="flex flex-col gap-4">
            <img
              src={previewImage.url}
              alt={previewImage.name}
              className="w-full max-h-[70vh] object-contain rounded-lg"
              data-testid="preview-image"
            />
            
            <div className="flex items-center justify-between gap-2">
              <a
                href={previewImage.url}
                download={previewImage.name}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium border rounded-md bg-background hover:bg-muted transition-colors"
                data-testid="link-download-image"
              >
                <Download className="w-4 h-4" />
                {t.download}
              </a>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setPreviewImage(null)}
                data-testid="button-close-preview"
              >
                <X className="w-4 h-4 ltr:mr-1 rtl:ml-1" />
                {t.close}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
    </>
  );
}

export default CampaignModal;
