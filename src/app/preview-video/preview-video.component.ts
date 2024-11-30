import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ApiService } from '../api.service';

@Component({
  selector: 'app-preview-video',
  templateUrl: './preview-video.component.html',
  styleUrls: ['./preview-video.component.css'],
})
export class PreviewVideoComponent implements OnChanges {
  @Input() videoUrl: string = ''; // URL for video preview
  @Input() gesture: string = ''; // Gesture name
  @Input() recordedChunks: Blob[] = []; // Video chunks for submission
  @Output() onVideoSubmitted = new EventEmitter<boolean>(); // Emit event after submission

  sanitizedVideoUrl: SafeUrl | null = null; // Sanitized URL for video preview
  statusMessage: string = ''; // Status message for submission

  constructor(private sanitizer: DomSanitizer, private apiService: ApiService) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['videoUrl'] && this.videoUrl) {
      console.log('Received videoUrl in Preview Component:', this.videoUrl);
      this.sanitizedVideoUrl = this.sanitizer.bypassSecurityTrustUrl(this.videoUrl);
    }
  }

  submitVideo(): void {
    if (!this.videoUrl || this.recordedChunks.length === 0) {
      this.statusMessage = 'No video to submit.';
      return;
    }

    // Create Blob from the recorded chunks
    const videoBlob = new Blob(this.recordedChunks, { type: 'video/webm' });

    // Prepare form data
    const formData = new FormData();
    formData.append('gesture', this.gesture);
    formData.append('file', videoBlob, `${this.gesture}_${Date.now()}.webm`);

    this.statusMessage = 'Uploading video...';

    // API call to upload the video
    this.apiService.uploadVideo(formData).subscribe(
      (res) => {
        this.statusMessage = res.message || 'Video submitted successfully!';
        this.onVideoSubmitted.emit(true); // Notify parent of success
      },
      (err) => {
        console.error('Video submission error:', err);
        this.statusMessage = 'Failed to submit video. Please try again.';
        this.onVideoSubmitted.emit(false); // Notify parent of failure
      }
    );
  }
}
