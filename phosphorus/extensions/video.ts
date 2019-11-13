/// <reference path="extension.ts" />

namespace P.ext.video {
  export class VideoExtension extends P.ext.Extension {
    public video: HTMLVideoElement;
    public opacity: number = 0.5;
    public error: boolean = false;

    constructor(stage: P.core.Stage) {
      super(stage);
    }

    createVideoStream(): HTMLVideoElement {
      if (!navigator.mediaDevices) {
        // non-https pages
        throw new Error('Cannot get video stream: mediaDevices is not defined');
      }
      const element = document.createElement('video');
      element.onloadedmetadata = () => element.play();
      element.style.opacity = this.opacity.toString();
      navigator.mediaDevices.getUserMedia({video: true, audio: false})
        .then((stream) => this.video.srcObject = stream);
      return element;
    }

    showVideo(visible: boolean) {
      if (this.error) {
        return;
      }
      if (visible) {
        if (!this.video) {
          try {
            this.video = this.createVideoStream();
            this.stage.root.insertBefore(this.video, this.stage.canvas);
          } catch (e) {
            console.error(e);
            this.error = true;
            return;
          }
        }
        this.video.style.display = 'block';
      } else {
        if (this.video) {
          this.video.style.display = 'none';
        }
      }
    }
  }
}
