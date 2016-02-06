window.onload = function () {
    var can_holder = $("#selector");
    $(can_holder).append("<canvas id=\"selector_can\"></canvas>");

    var can = document.getElementById("selector_can");
        can.width = $("#selector").innerWidth();
        can.height = $("#selector").innerHeight();
    var can_rect = can.getBoundingClientRect();
    var ctx = can.getContext("2d");

    $(window).resize(function () {
        can.width = $("#selector").innerWidth();
        can.height = $("#selector").innerHeight();
    });

    var tex;
    var img = new Image();
    img.src = "img/12.png";
    img.onload = function () {
        var s = can.height/img.height;
        tex = new Page(this, 0,0, s);
        render_loop();
    }

    var states = {
        NONE: 0,
        SELECT: 1,
        VIEW: 2
    };
    var state = states.NONE;
    function next_state(st) {
        st++;
        if (st>=states.length) st=0;
    }

    var point_2 = {x: 0, y:0}
    var m_point; // Move Point
    var moving = false;
    $("#selector_can").mousemove(function (e) {
        if (state == states.SELECT) {
            point_2 = get_mouse_pos(e, can_rect);
        } else if (moving) {
            var c_point = get_mouse_pos(e, can_rect);

            var delta = {
                x: c_point.x - m_point.x,
                y: c_point.y - m_point.y
            };

            tex.x = delta.x + tex.x;
            tex.y = delta.y + tex.y;
            // ctx.translate(delta.x, delta.y);

            m_point = c_point;
        }
    });

    // Right click (Move Page)
    $("#selector_can").on("contextmenu", function () {
        return false;
    });
    $("#selector_can").mousedown(function (e) {
        if (e.which === 3) {
            e.preventDefault();
            moving = true;
            m_point = get_mouse_pos(e, can_rect);
        }
    });
    $("#selector_can").mouseup(function (e) {
        moving = false;
    });

    // Left click (Select)
    var point_1;
    var s_points;
    $("#selector_can").click(function (e) {
        if (state == states.NONE) {
            point_1 = get_mouse_pos(e, can_rect);
            point_2 = point_1;

            state++;
        } else if (state == states.SELECT) {
            s_points = get_coords(tex,point_1,point_2);

            // Display Select Prompt
            $("#selection-dialog").hide();
            $("#selection-prompt").show();

            state++;
        } else if (state == states.VIEW) {
        }
    });

    // OK Button click
    // TODO: Button Should Switch To Next Item
    $("#btn-yes").on("click", function () {
    });

    // NO Button click
    $("#btn-no").on("click", function () {
        if (state == states.VIEW) {
            // Display Instruction Div
            $("#selection-dialog").show();
            $("#selection-prompt").hide();

            state=0;
        }
    });

    // Mouse Wheel
    $("#selector_can").bind('mousewheel', function (e) {
        e.preventDefault();

        var mpos = get_mouse_pos(e,can_rect);
        mpos.x -= tex.x;
        mpos.y -= tex.y;

        var wDelta = e.originalEvent.wheelDelta/120;
        var zoom = Math.pow(1+Math.abs(wDelta)/2, wDelta > 0 ? 1: -1);

        // Scale Image
        tex.scale *= zoom;
        tex.set_scale(tex.scale);

        // Translate Image
        tex.x -= (mpos.x*zoom - mpos.x);
        tex.y -= (mpos.y*zoom - mpos.y);

    });

    function render_loop() {
        // ctx.clearRect(0,0,can.width,can.height);
        ctx.beginPath();
        ctx.rect(0,0,can.width,can.height);
        ctx.fillStyle = "#ebebeb";
        ctx.fill();

        if (state !== states.VIEW) {
            tex.render(ctx);
        } else {
            tex.p_render(ctx, s_points[0], s_points[1]);
        }

        // Draw Select Rectangle
        if (state == states.SELECT) {
            ctx.beginPath();
            ctx.rect(point_1.x, point_1.y, (point_2.x-point_1.x), (point_2.y-point_1.y));
            ctx.stroke();
        }

        window.requestAnimationFrame(render_loop);
    }
}

function get_mouse_pos (e, can) {
    return {
        x: e.pageX - can.left,
        y: e.pageY - can.top
    }
}

function get_coords (obj, point_1, point_2) {
    var p_1 = {
        x: ((point_1.x-obj.x)/obj.scale),
        y: ((point_1.y-obj.y)/obj.scale)
    };
    var p_2 = {
        x: ((point_2.x-obj.x)/obj.scale),
        y: ((point_2.y-obj.y)/obj.scale)
    };

    return [p_1, p_2];
}

var Page = function (img, x, y, scale) {
    this.img = img;

    this.x = x;
    this.y = y;

    this.set_scale(scale);
};

Page.prototype.set_scale = function (scale) {
    // if (scale >= 2) {
    //     scale = 2;
    // } else if (scale <= 0.1) {
    //     scale = 0.1;
    // }
    this.scale = (scale);

    this.w = this.img.width * this.scale;
    this.h = this.img.height * this. scale;
};

Page.prototype.render = function (ctx) {
    ctx.drawImage(
        this.img, 0,0,this.img.width,this.img.height,
        this.x,this.y,this.w,this.h);
};

Page.prototype.p_render = function (ctx, p1, p2) {
    ctx.drawImage(
        this.img, p1.x,p1.y,p2.x-p1.x,p2.y-p1.y,
        0,0,(p2.x-p1.x)*this.scale,(p2.y-p1.y)*this.scale);
};
