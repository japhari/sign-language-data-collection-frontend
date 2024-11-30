import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnInit,
  ChangeDetectorRef,
} from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import Swal from 'sweetalert2';
import { ApiService } from '../api.service';

@Component({
  selector: 'app-data-collection',
  templateUrl: './data-collection.component.html',
  styleUrls: ['./data-collection.component.css'],
})
export class DataCollectionComponent implements AfterViewInit, OnInit {
  gestures: string[] = [];
  selectedGesture: string = '';
  isRecording: boolean = false;
  statusMessage: string = '';
  healthStatus: string = '';
  recordedVideoUrl: SafeUrl | null = null;
  recordingProgress: number = 0; // Progress bar percentage
  remainingTime: number = 5; // Time remaining in seconds
  recordedChunks: Blob[] = [];
  interval: any;
  mediaRecorder: any;

  @ViewChild('videoElement', { static: true })
  videoElement!: ElementRef<HTMLVideoElement>;

  constructor(
    private apiService: ApiService,
    private cdr: ChangeDetectorRef,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
    this.apiService.getGestures().subscribe(
      (data: any) => (this.gestures = data.gestures),
      (err) => console.error('Error fetching gestures:', err)
    );

    this.apiService.healthCheck().subscribe(
      (res) => (this.healthStatus = res.status),
      (err) => (this.healthStatus = 'Backend not available.')
    );
  }

  ngAfterViewInit(): void {
    navigator.mediaDevices.getUserMedia({ video: true }).then(
      (stream) => {
        this.videoElement.nativeElement.srcObject = stream;
      },
      (err) => {
        Swal.fire({
          icon: 'error',
          title: 'Webcam Error',
          text: 'Could not access webcam. Please check your device permissions.',
        });
        this.statusMessage = 'Could not access webcam.';
      }
    );
  }

  startRecording(): void {
    if (!this.selectedGesture) {
      Swal.fire({
        icon: 'warning',
        title: 'Gesture Not Selected',
        text: 'Please select a gesture before recording.',
      });
      return;
    }

    this.recordedChunks = [];
    this.recordingProgress = 0;
    this.remainingTime = 5;
    this.isRecording = true;

    const stream = this.videoElement.nativeElement.srcObject as MediaStream;
    this.mediaRecorder = new MediaRecorder(stream);

    this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
      if (event.data.size > 0) {
        this.recordedChunks.push(event.data);
      }
    };

    this.interval = setInterval(() => {
      this.recordingProgress += 100 / 50; // 50 updates over 5 seconds
      this.remainingTime = Math.max(0, this.remainingTime - 0.1);

      if (this.recordingProgress >= 100) {
        clearInterval(this.interval);
        if (this.isRecording) {
          this.stopRecording();
        }
      }

      this.cdr.detectChanges();
    }, 100);

    this.mediaRecorder.start();
    this.statusMessage = 'Recording...';
  }

  stopRecording(): void {
    this.mediaRecorder.stop();
    this.isRecording = false;
    clearInterval(this.interval);

    this.mediaRecorder.onstop = () => {
      const videoBlob = new Blob(this.recordedChunks, { type: 'video/webm' });
      const unsafeUrl = URL.createObjectURL(videoBlob);

      // Sanitize the Blob URL
      this.recordedVideoUrl = this.sanitizer.bypassSecurityTrustUrl(unsafeUrl);

      console.log('Generated Preview URL:', this.recordedVideoUrl);

      this.cdr.detectChanges();
      Swal.fire({
        icon: 'info',
        title: 'Recording Stopped',
        text: 'Preview your video below and submit it.',
      });
    };
  }

  submitVideo(): void {
    if (!this.recordedVideoUrl || this.recordedChunks.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Video to Submit',
        text: 'Please record a video before submitting.',
      });
      return;
    }

    const videoBlob = new Blob(this.recordedChunks, { type: 'video/webm' });

    const formData = new FormData();
    formData.append('gesture', this.selectedGesture);
    formData.append('file', videoBlob, `${this.selectedGesture}_${Date.now()}.webm`);

    Swal.fire({
      title: 'Uploading...',
      text: 'Your video is being uploaded. Please wait...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    this.apiService.uploadVideo(formData).subscribe(
      (res: any) => {
        Swal.fire({
          icon: 'success',
          title: 'Video Submitted!',
          text: res.message || 'Your video has been uploaded successfully.',
        });

        this.resetForm(); // Reset the form and clear the video
      },
      (err) => {
        Swal.fire({
          icon: 'error',
          title: 'Submission Failed',
          text: 'Failed to submit video. Please try again.',
        });
      }
    );
  }

  resetForm(): void {
    this.recordedVideoUrl = null;
    this.recordedChunks = [];
    this.selectedGesture = '';
    this.recordingProgress = 0;
    this.statusMessage = '';
    this.remainingTime = 5;
    this.isRecording = false;

    Swal.fire({
      icon: 'info',
      title: 'Ready for Another Recording',
      text: 'The form has been reset. You can now select a new gesture and start recording.',
    });
  }
}
