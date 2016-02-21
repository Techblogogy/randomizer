var fs = window.nodeRequire("fs");
var pdf = window.nodeRequire("pdfkit");

var remote = window.nodeRequire("remote");
var dialog = remote.require("dialog");

// var p_fix = "res/img/pack1/pages/";
var g_path = remote.getGlobal("paths").app_path;
var p_fix = g_path+"/res/img/pack1/pages/";

var task_list = []; // All Available Tasks
var imgs_list = []; // Randomized Images List

var max_uin = 10; // Maximum Subject
var max_maj = 2; // Maximum Variant
var max_min = 37; // 37; // Maximum Task

var blurRadius = 1.0;
var blur_active = false;


// Returns random in [min, max] (edges included)
function get_random(min, max) {
    return Math.floor(Math.random() * (max+1 - min)) + min;
}

// Returns An Array Of Random Tasks
function get_items () {
    task_list = JSON.parse(fs.readFileSync(g_path+"/res/img/pack1/db.json"));
    console.log(task_list);

    var rnd_tsk = [];
    for (var i=1; i<=max_min; i+=2) {
        var uin = get_random(1,max_uin);
        var maj = get_random(1,max_maj);

        var im = find_byNum(task_list, [uin,maj,i]);
        for (var a in im) {
            imgs_list.push(im[a]);
        }
    }

    console.log(imgs_list);
}

function find_byNum(array, value) {
    var ids = [];
    for (var a=0; a<array.length; a++) {
        if (array_equal(array[a].num, value)) {
            ids.push(a);
        }
    }
    return ids;
}
function array_equal(a1,a2) {
    for (var p=0; p<a1.length; p++) {
        if (a1[p] !== a2[p]) {
            return false;
        }
    }
    return true;
}

window.onload = function () {
    get_items();

    // gen_PDF();

    var dm_id = -1;
    function image_DOM () {
        dm_id++;

        if (dm_id < selections.length) {
            var idg = new Image();
            idg.id = "i_"+dm_id;
            idg.src = p_fix+selections[dm_id].image;
            idg.onload = function () {
                document.getElementById("rnd_imgs").appendChild(this);
                image_DOM();
            }

        } else {
            var rc = new RenderCanvas();
            rc.render(selections);

            // Save Images
            for (var i=0; i<rc.cnvs.length; i++) {
                var dat = (rc.cnvs[i].toDataURL());
                dat = dat.replace(/^data:image\/\w+;base64,/, "");

                var buf = new Buffer(dat, 'base64');
                fs.writeFileSync('.image_'+i+'.png', buf);
            }

            // Save File Dialog
            dialog.showSaveDialog({filters: [
                {name: "text", extensions: ['pdf']}
            ]}, function (fname) {
                if (fname !== undefined) {
                    console.log("Saving...");

                    // Save PDF
                    doc = new pdf({size: "A4", layout: "landscape"});
                    doc.pipe(fs.createWriteStream(fname));

                    for (var i=0; i<rc.cnvs.length; i++) {
                        doc.image(".image_"+i+".png", 0, 0, {width: 842});
                        if (i !== rc.cnvs.length-1) doc.addPage();
                    }

                    doc.end();

                    console.log("Saved");
                }

                // Remove Images
                for (var i=0; i<rc.cnvs.length; i++) {
                    fs.unlinkSync('.image_'+i+'.png');
                }

            });
        }
    }

    var can_holder = $("#selector"); // Canvas DIV

    // Add Canvas Element
    $(can_holder).append("<canvas id=\"selector_can\"></canvas>");

    // Canvas Initialization
    var can = document.getElementById("selector_can");
        can.width = $("#selector").innerWidth();
        can.height = $("#selector").innerHeight();
    var can_rect = can.getBoundingClientRect();
    var ctx = can.getContext("2d");

    // Window Resize Event
    $(window).resize(function () {
        can.width = $("#selector").innerWidth();
        can.height = $("#selector").innerHeight();
    });

    var selections = [];
    var cur_img_id = -1;

    var tex; // Main Page
    var img = new Image(); // Page Image

    next_image();

    // Selection States ENUM
    var states = {
        NONE: 0,
        SELECT: 1,
        VIEW: 2,

        CROP: 3
    };
    // Current State
    var state = states.NONE;
    function next_state(st) {
        st++;
        if (st>=states.length) st=0;
    }

    var point_1; // Selection Point 1
    var point_2 = {x: 0, y:0} // Selection Point 2

    var m_point; // Previous Mouse Position
    var moving = false; // Right Mouse Hold Boolean
    $("#selector_can").mousemove(function (e) {
        if (state == states.SELECT || state == states.CROP) {
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

    /* (Move Page) */
    // Disable Context Menu
    $("#selector_can").on("contextmenu", function () {
        return false;
    });

    // Right Mouse Click
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
    var s_points;
    $("#selector_can").click(function (e) {
        if (state == states.NONE || state == state.CROP) {
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

    function next_image() {
        // if (cur_img_id !== 0) cur_img_id++;
        cur_img_id++;

        if (cur_img_id >= imgs_list.length) {
            console.log("THE END");

            $("#gen_txt").show();
            $(can).hide();

            // TEMP: Save Selections
            // fs.writeFileSync("Electron/img/pack1/task.json", JSON.stringify(selections));

            // Save DB
            fs.writeFileSync(g_path+"/res/img/pack1/db.json", JSON.stringify(task_list));

            // Render Image Into DOM
            // for (var n=0; n<selections.length; n++) {
            //
            // }

            image_DOM();

            // Render Canvas
            // var rc = new RenderCanvas();

            return;
        }

        // Reset Style And Menus
        state = 0;
        $("#selection-dialog").show();
        $("#selection-prompt").hide();

        var img_id = imgs_list[cur_img_id];

        // Check If Points Are Saved
        if (task_list[img_id].point !== undefined) {
            selections.push({
                point: task_list[img_id].point,
                image: task_list[img_id].image
            });

            next_image();
            return;
        }

        $(".num-field").text(task_list[img_id].num[0]+"."+task_list[img_id].num[1]+"."+task_list[img_id].num[2]);
        console.log(task_list[img_id]);
        img.src = p_fix+task_list[img_id].image; // Page Image

        // New Image Load Event
        img.onload = function () {
            if (tex === undefined) {
                tex = new Page(img, 0,0, can.height/img.height);
                render_loop();
            } else {
                tex.reset(can.height/img.height);
            }
        }
    }

    // OK Button click
    $("#btn-yes").on("click", function () {
        var img_id = imgs_list[cur_img_id];
        selections.push({
            point: s_points,
            image: task_list[img_id].image
        });

        // var ti = find_byTask(task_list, "num", imgs_list[cur_img_id].num);
        task_list[img_id].point = s_points;

        next_image();
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

        // if (blur_active) {
            // stackBlurCanvasRGBA( ctx, 0, 0, can.width, can.height, blurRadius);
            // blur_active = false;
        // }

        // Draw Select Rectangle
        if (state == states.SELECT) {
            ctx.beginPath();
            ctx.rect(point_1.x, point_1.y, (point_2.x-point_1.x), (point_2.y-point_1.y));
            ctx.stroke();
        }

        window.requestAnimationFrame(render_loop);
    }
}

// Returns Mouse Position From Event
function get_mouse_pos (e, can) {
    return {
        x: e.pageX - can.left,
        y: e.pageY - can.top
    }
}

// Returns Coordinates Relative To Scale
function get_coords (obj, point_1, point_2) {
    // Get MIN/MAX X Point
    var min_x = Math.min(point_1.x,point_2.x);
    var max_x = Math.max(point_1.x,point_2.x);

    // Get MIN/MAX Y Point
    var min_y = Math.min(point_1.y,point_2.y);
    var max_y = Math.max(point_1.y,point_2.y);

    var p_1 = {
        x: ((min_x-obj.x)/obj.scale),
        y: ((min_y-obj.y)/obj.scale)
    };
    var p_2 = {
        x: ((max_x-obj.x)/obj.scale),
        y: ((max_y-obj.y)/obj.scale)
    };

    return [p_1, p_2];
}

/* Page Class */
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

Page.prototype.reset = function (s) {
    this.x = 0;
    this.y = 0;

    this.set_scale(s);
}
