import { useState, useEffect, useCallback } from 'react';
import { X, FileText, Download, ExternalLink, ClipboardList, Image as ImageIcon, Video } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useDaamStore } from '@/hooks/use-daam-store';
import type { Campaign, CampaignAttachment } from '@/types/campaign';
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
    openFile: 'فتح الملف',
    download: 'تحميل',
    takeSurvey: 'المشاركة في الاستبيان',
    images: 'الصور',
    video: 'الفيديو',
    files: 'الملفات',
    survey: 'استبيان',
    noContent: 'لا يوجد محتوى',
    loading: 'جاري التحميل...',
  },
  en: {
    close: 'Close',
    openFile: 'Open File',
    download: 'Download',
    takeSurvey: 'Take Survey',
    images: 'Images',
    video: 'Video',
    files: 'Files',
    survey: 'Survey',
    noContent: 'No content',
    loading: 'Loading...',
  }
};

export function CampaignModal({ open, onOpenChange, campaign }: CampaignModalProps) {
  const { lang } = useDaamStore();
  const t = translations[lang];
  const isRTL = lang === 'ar';

  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [imageUrls, setImageUrls] = useState<Map<string, string>>(new Map());
  const [loadingFile, setLoadingFile] = useState<string | null>(null);

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

  // Load image URLs
  useEffect(() => {
    if (!open || images.length === 0) return;

    const loadImages = async () => {
      const urls = new Map<string, string>();
      
      for (const img of images) {
        const blob = await getCampaignAttachmentBlob(img.id);
        if (blob) {
          urls.set(img.id, URL.createObjectURL(blob));
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

  // Handle file open/download
  const handleFileOpen = useCallback(async (attachment: CampaignAttachment) => {
    setLoadingFile(attachment.id);
    trackClick(campaign.id);

    try {
      const blob = await getCampaignAttachmentBlob(attachment.id);
      if (blob) {
        const url = URL.createObjectURL(blob);
        
        // Open PDF in new tab
        if (attachment.mime === 'application/pdf') {
          window.open(url, '_blank');
        } else {
          // Download other files
          const a = document.createElement('a');
          a.href = url;
          a.download = attachment.name;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
        
        // Revoke after a short delay to allow download/open
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    } catch (error) {
      console.error('Failed to open file:', error);
    } finally {
      setLoadingFile(null);
    }
  }, [campaign.id]);

  // Handle survey click
  const handleSurveyClick = useCallback(() => {
    if (campaign.survey?.url) {
      trackClick(campaign.id);
      window.open(campaign.survey.url, '_blank', 'noopener,noreferrer');
    }
  }, [campaign.id, campaign.survey?.url]);

  const surveyLabel = campaign.survey?.label 
    ? (lang === 'ar' ? campaign.survey.label.ar : campaign.survey.label.en)
    : t.takeSurvey;

  const hasAnyContent = images.length > 0 || videos.length > 0 || hasLegacyVideo || files.length > 0 || campaign.survey?.url;

  return (
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
                  <div key={img.id} className="aspect-square rounded-lg overflow-hidden bg-muted">
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
                  </div>
                ))}
              </div>
            </div>
          )}

          {files.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <FileText className="w-4 h-4" />
                {t.files} ({files.length})
              </div>
              <div className="space-y-2">
                {files.map((file) => (
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
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleFileOpen(file)}
                      disabled={loadingFile === file.id}
                      className="flex-shrink-0"
                      data-testid={`button-open-file-${file.id}`}
                    >
                      {loadingFile === file.id ? (
                        <span className="animate-spin">⏳</span>
                      ) : (
                        <>
                          <ExternalLink className="w-4 h-4 ltr:mr-1 rtl:ml-1" />
                          {t.openFile}
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {campaign.survey?.url && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <ClipboardList className="w-4 h-4" />
                {t.survey}
              </div>
              <Button
                variant="default"
                onClick={handleSurveyClick}
                className="w-full"
                data-testid="button-take-survey"
              >
                <ExternalLink className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
                {surveyLabel}
              </Button>
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
  );
}

export default CampaignModal;
