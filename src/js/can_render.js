var RenderCanvas = function () {
    // A4 Page. DPI: 300
    this.pageH = 2480;
    this.pageW = 3508;

    // Border Offset In PX
    this.offset = 50;

    // Smoothing Radius
    this.blurRadius = 1.0;

    // Positions
    this.lastY = 0;
    this.lastX = 0;

    this.cnvs = []; // Array Of Canvases

    this.cnv; // Current Canvas
    this.ctx; // Current Context

    // Current Array Id
    this.id = 0;
};

RenderCanvas.prototype.new_canvas = function () {
    this.cnv = document.createElement("canvas");
        this.cnv.width = this.pageW;
        this.cnv.height = this.pageH;
    this.ctx = this.cnv.getContext("2d");

    this.ctx.fillStyle = "#fff";
    this.ctx.fillRect(0,0,this.cnv.width,this.cnv.height);

    this.lastY = this.offset;
    this.lastX = this.offset;

    this.cnvs.push(this.cnv);

    // document.body.appendChild(cnv);
}

// Renders An Array Of Images
RenderCanvas.prototype.render = function (images) {
    this.new_canvas();

    for (this.id=0; this.id<images.length; this.id++) {
        var w = this.cnv.width/2 - this.offset;
        var h = (images[this.id].point[1].y-images[this.id].point[0].y) * w / (images[this.id].point[1].x-images[this.id].point[0].x);

        // Paper Economy
        if (h >= 140 && h < 200) {
            h = 140;
        } else if (h > 200 && h < 300) {
            h = h*0.9;
        } else if (h > 300 && h < 400) {
            h = h*0.8;
        } else if (h > 400 && h <= 500) {
            h = h*0.65;
        } else if (h > 500) {
            h = h*0.75;
        }

        // Switch Column
        if ((this.lastY+h+this.offset) > this.cnv.height) {
            this.lastY = this.offset;
            this.lastX += this.cnv.width/2-this.offset;
        }

        // Switch Page
        if (this.lastX+this.offset >= this.cnv.width) {
            stackBlurCanvasRGB( this.ctx, 0, 0, this.cnv.width, this.cnv.height, this.blurRadius);
            this.new_canvas();
        }

        this.ctx.drawImage(
            document.getElementById("i_"+this.id),
            images[this.id].point[0].x,images[this.id].point[0].y,
            images[this.id].point[1].x-images[this.id].point[0].x,
            images[this.id].point[1].y-images[this.id].point[0].y,
            this.lastX,this.lastY,w,h
        );
        this.lastY += h;

        console.log((this.id+1)+" "+h);
    }

    stackBlurCanvasRGBA( this.ctx, 0, 0, this.cnv.width, this.cnv.height, this.blurRadius);
}

RenderCanvas.prototype.get_blobs = function () {

}
