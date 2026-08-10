
const canvas = document.getElementById("kinetic-grid");
const ctx = canvas.getContext("2d");

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

resize();
window.addEventListener("resize", resize);

let mouse = {
    x: -1000,
    y: -1000
};

window.addEventListener("mousemove", e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

function draw() {
    ctx.clearRect(0,0,canvas.width,canvas.height);

    const spacing = 40;

    for(let x=0;x<canvas.width;x+=spacing){
        for(let y=0;y<canvas.height;y+=spacing){

            let dx = mouse.x - x;
            let dy = mouse.y - y;
            let distance = Math.sqrt(dx*dx + dy*dy);

            let offsetX = 0;
            let offsetY = 0;

            if(distance < 150){
                offsetX = dx * 0.1;
                offsetY = dy * 0.1;
            }

            ctx.beginPath();
            ctx.arc(x + offsetX, y + offsetY, 2, 0, Math.PI*2);
            ctx.fillStyle = "#ffffff";
            ctx.fill();
        }
    }

    requestAnimationFrame(draw);
}
draw();


/* =========================================
   LIGHTNING CURSOR
========================================= */

const lightningCanvas =
    document.getElementById("lightning-cursor");

const lightningCtx =
    lightningCanvas.getContext("2d");


/* -----------------------------------------
   SETTINGS
----------------------------------------- */

const lightningSettings = {
    color: "#ffffff",
    thickness: 0.8,
    glowIntensity: 10,
    trailLength: 7,
    intensity: 70
};

/* -----------------------------------------
   CONSTANTS
----------------------------------------- */

const CRACKLE = 20;
const FADE_SPEED = 15;
const MAX_SPREAD = 40;

const SEG_PX = 5;
const MAX_SUB = 64;
const MIN_STEP = 8;

const SMOOTHNESS = 0.7;

const GLYPH_THICKNESS = 2;

const BRANCH_CHANCE = 0.02;
const BRANCH_MIN_DIST = 15;


/* -----------------------------------------
   CANVAS
----------------------------------------- */

let lightningWidth = 1;
let lightningHeight = 1;


function resizeLightning() {

    const dpr =
        Math.min(
            window.devicePixelRatio || 1,
            2
        );

    lightningWidth =
        window.innerWidth;

    lightningHeight =
        window.innerHeight;


    lightningCanvas.width =
        Math.floor(
            lightningWidth * dpr
        );

    lightningCanvas.height =
        Math.floor(
            lightningHeight * dpr
        );


    lightningCanvas.style.width =
        lightningWidth + "px";

    lightningCanvas.style.height =
        lightningHeight + "px";


    lightningCtx.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0
    );
}


resizeLightning();

window.addEventListener(
    "resize",
    resizeLightning
);


/* -----------------------------------------
   MOUSE
----------------------------------------- */

let lightningMouseX = -9999;
let lightningMouseY = -9999;

let lightningInside = false;
let lightningSeen = false;

let lightningLastMove = 0;


/* -----------------------------------------
   TRAIL
----------------------------------------- */

let lightningTrail = [];

let lightningBolts = [];

let glyphBolts = [];


/* -----------------------------------------
   LIGHTNING SHAPE
----------------------------------------- */

const GLYPH = [

    { x: 0, y: 0 },

    { x: 0, y: 18 },

    { x: 5, y: 14 },

    { x: 9, y: 23 },

    { x: 12, y: 21 },

    { x: 8, y: 12 },

    { x: 15, y: 12 },

    { x: 0, y: 0 }

];


/* -----------------------------------------
   CREATE LIGHTNING
----------------------------------------- */

function makeLightningBolt() {

    const offsets = [];
    const branches = [];


    for (
        let i = 0;
        i < MAX_SUB;
        i++
    ) {

        offsets.push(
            Math.random() - 0.5
        );


        if (
            Math.random() <
            BRANCH_CHANCE
        ) {

            branches.push({

                t: i / MAX_SUB,

                angle:
                    (
                        Math.random() - 0.5
                    ) *
                    (
                        Math.PI / 1.5
                    ),

                length:
                    5 +
                    Math.random() * 15

            });
        }
    }


    return {
        offsets,
        branches
    };
}


/* -----------------------------------------
   CREATE BOLTS
----------------------------------------- */

function createLightningBolts() {

    const amount =
        Math.max(
            2,
            lightningSettings.trailLength
        );


    lightningBolts =
        Array.from(
            {
                length: amount
            },
            makeLightningBolt
        );


    glyphBolts =
        Array.from(
            {
                length:
                    GLYPH.length - 1
            },
            makeLightningBolt
        );
}


createLightningBolts();


/* -----------------------------------------
   ADD TRAIL POINT
----------------------------------------- */

function addLightningPoint(x, y) {

    const head =
        lightningTrail[0];


    if (
        !head ||
        Math.hypot(
            x - head.x,
            y - head.y
        ) >= MIN_STEP
    ) {

        lightningTrail.unshift({
            x,
            y
        });
    }
}


/* -----------------------------------------
   MOUSE MOVE
----------------------------------------- */

window.addEventListener(
    "pointermove",
    function (event) {

        lightningMouseX =
            event.clientX;

        lightningMouseY =
            event.clientY;


        if (!lightningInside) {

            lightningTrail = [

                {
                    x:
                        lightningMouseX,

                    y:
                        lightningMouseY
                }

            ];
        }


        addLightningPoint(
            lightningMouseX,
            lightningMouseY
        );


        lightningInside = true;
        lightningSeen = true;

        lightningLastMove =
            performance.now();


        lightningCanvas.style.opacity =
            "1";


        document.documentElement
            .classList
            .add("lightning-active");

    },
    {
        passive: true
    }
);


/* -----------------------------------------
   MOUSE LEAVE
----------------------------------------- */

document.documentElement.addEventListener(
    "mouseleave",
    function () {

        lightningInside = false;

        document.documentElement
            .classList
            .remove(
                "lightning-active"
            );
    }
);


/* -----------------------------------------
   DRAW LIGHTNING
----------------------------------------- */

function strokeLightning(
    a,
    b,
    bolt,
    lineWidth,
    spread,
    smooth,
    prev,
    next
) {

    const dx =
        b.x - a.x;

    const dy =
        b.y - a.y;


    const distance =
        Math.hypot(dx, dy);


    if (
        distance < 1 ||
        lineWidth < 0.1
    ) {
        return;
    }


    const sub =
        Math.max(
            3,
            Math.min(
                MAX_SUB,
                Math.ceil(
                    distance / SEG_PX
                )
            )
        );


    const amplitude =
        Math.min(
            distance * 0.3,
            spread
        );


    const p0 =
        prev || a;

    const p3 =
        next || b;


    const cx = [];
    const cy = [];


    for (
        let i = 0;
        i <= sub;
        i++
    ) {

        const t =
            i / sub;

        const t2 =
            t * t;

        const t3 =
            t2 * t;


        const crx =
            0.5 *
            (
                2 * a.x +

                (-p0.x + b.x) * t +

                (
                    2 * p0.x -
                    5 * a.x +
                    4 * b.x -
                    p3.x
                ) * t2 +

                (
                    -p0.x +
                    3 * a.x -
                    3 * b.x +
                    p3.x
                ) * t3
            );


        const cry =
            0.5 *
            (
                2 * a.y +

                (-p0.y + b.y) * t +

                (
                    2 * p0.y -
                    5 * a.y +
                    4 * b.y -
                    p3.y
                ) * t2 +

                (
                    -p0.y +
                    3 * a.y -
                    3 * b.y +
                    p3.y
                ) * t3
            );


        cx.push(
            a.x +
            dx * t +
            (
                crx -
                (a.x + dx * t)
            ) *
            smooth
        );


        cy.push(
            a.y +
            dy * t +
            (
                cry -
                (a.y + dy * t)
            ) *
            smooth
        );
    }


    function normalAt(i) {

        const lo =
            Math.max(
                0,
                i - 1
            );


        const hi =
            Math.min(
                sub,
                i + 1
            );


        const tx =
            cx[hi] -
            cx[lo];

        const ty =
            cy[hi] -
            cy[lo];


        const len =
            Math.hypot(
                tx,
                ty
            );


        if (
            len < 0.0001
        ) {

            return [
                -dy / distance,
                dx / distance
            ];
        }


        return [
            -ty / len,
            tx / len
        ];
    }


    lightningCtx.beginPath();


    lightningCtx.moveTo(
        cx[0],
        cy[0]
    );


    for (
        let i = 1;
        i < sub;
        i++
    ) {

        const normal =
            normalAt(i);


        const offset =
            bolt.offsets[i] *
            amplitude;


        lightningCtx.lineTo(

            cx[i] +
            normal[0] *
            offset,

            cy[i] +
            normal[1] *
            offset
        );
    }


    lightningCtx.lineTo(
        cx[sub],
        cy[sub]
    );


    lightningCtx.lineWidth =
        lineWidth;


    lightningCtx.stroke();


    /* Branches */

    if (
        distance <
        BRANCH_MIN_DIST
    ) {
        return;
    }


    const branchWidth =
        Math.max(
            1,
            lineWidth * 0.5
        );


    const oldAlpha =
        lightningCtx.globalAlpha;


    lightningCtx.globalAlpha =
        oldAlpha * 0.8;


    for (
        const branch of bolt.branches
    ) {

        const i =
            Math.min(
                sub,
                Math.floor(
                    branch.t * sub
                )
            );


        const normal =
            normalAt(i);


        const offset =
            bolt.offsets[i] *
            amplitude;


        const startX =
            cx[i] +
            normal[0] *
            offset;


        const startY =
            cy[i] +
            normal[1] *
            offset;


        const endX =
            startX +
            Math.cos(
                branch.angle
            ) *
            branch.length;


        const endY =
            startY +
            Math.sin(
                branch.angle
            ) *
            branch.length;


        lightningCtx.beginPath();


        lightningCtx.moveTo(
            startX,
            startY
        );


        lightningCtx.lineTo(
            (startX + endX) / 2,
            (startY + endY) / 2
        );


        lightningCtx.lineTo(
            endX,
            endY
        );


        lightningCtx.lineWidth =
            branchWidth;


        lightningCtx.stroke();
    }


    lightningCtx.globalAlpha =
        oldAlpha;
}


/* -----------------------------------------
   DRAW WITH GLOW
----------------------------------------- */

function drawLightningBolt(
    a,
    b,
    bolt,
    width,
    spread,
    glow,
    smooth,
    prev,
    next
) {

    lightningCtx.shadowBlur =
        glow * 0.6;


    lightningCtx.strokeStyle =
        lightningSettings.color;


    strokeLightning(
        a,
        b,
        bolt,
        width * 2.5,
        spread,
        smooth,
        prev,
        next
    );


    /* White center */

    lightningCtx.strokeStyle =
        "#FFFFFF";


    strokeLightning(
        a,
        b,
        bolt,
        width,
        spread,
        smooth,
        prev,
        next
    );


    /* Outer glow */

    lightningCtx.shadowBlur =
        glow * 0.3;


    lightningCtx.strokeStyle =
        lightningSettings.color;


    strokeLightning(
        a,
        b,
        bolt,
        width,
        spread,
        smooth,
        prev,
        next
    );
}


/* -----------------------------------------
   ANIMATION
----------------------------------------- */

let lightningAnimation;

let lightningLastTime =
    performance.now();

let jitterAccumulator = 0;

let fadeAccumulator = 0;


function animateLightning(now) {

    const dt =
        Math.min(
            0.05,
            Math.max(
                0,
                (
                    now -
                    lightningLastTime
                ) / 1000
            )
        );


    lightningLastTime =
        now;


    jitterAccumulator += dt;


    const jitterStep =
        1 /
        (CRACKLE * 2);


    if (
        jitterAccumulator >=
        jitterStep
    ) {

        jitterAccumulator = 0;

        createLightningBolts();
    }


    lightningCtx.clearRect(
        0,
        0,
        lightningWidth,
        lightningHeight
    );


    if (!lightningSeen) {

        lightningAnimation =
            requestAnimationFrame(
                animateLightning
            );

        return;
    }


    const maxLength =
        Math.max(
            2,
            lightningSettings.trailLength
        );


    if (
        !lightningTrail.length
    ) {

        if (!lightningInside) {

            lightningAnimation =
                requestAnimationFrame(
                    animateLightning
                );

            return;
        }


        lightningTrail = [

            {
                x:
                    lightningMouseX,

                y:
                    lightningMouseY
            }

        ];

    } else if (
        !lightningInside ||
        now -
        lightningLastMove >
        50
    ) {

        fadeAccumulator +=
            dt *
            FADE_SPEED *
            6;


        while (
            fadeAccumulator >= 1 &&
            lightningTrail.length > 1
        ) {

            fadeAccumulator -= 1;

            lightningTrail.pop();
        }

    } else {

        fadeAccumulator = 0;
    }


    if (
        lightningTrail.length >
        maxLength
    ) {

        lightningTrail.length =
            maxLength;
    }


    const spread =
        (
            Math.max(
                0,
                Math.min(
                    100,
                    lightningSettings.intensity
                )
            ) / 100
        ) *
        MAX_SPREAD;


    lightningCtx.lineCap =
        "round";

    lightningCtx.lineJoin =
        "round";


    lightningCtx.shadowColor =
        lightningSettings.color;


    /* -------------------------------------
       TRAIL
    ------------------------------------- */

    for (
        let i = 0;
        i <
        lightningTrail.length - 1;
        i++
    ) {

        const fade =
            1 -
            i /
            Math.max(
                1,
                lightningTrail.length - 1
            );


        if (
            fade <= 0.02
        ) {
            continue;
        }


        lightningCtx.globalAlpha =
            fade;


        drawLightningBolt(

            lightningTrail[i],

            lightningTrail[i + 1],

            lightningBolts[i] ||
            lightningBolts[0],

            lightningSettings.thickness *
            fade,

            spread,

            lightningSettings.glowIntensity *
            fade,

            SMOOTHNESS,

            lightningTrail[i - 1],

            lightningTrail[i + 2]
        );
    }


    /* -------------------------------------
       CURSOR HEAD
    ------------------------------------- */

    if (!lightningInside) {

        lightningCtx.globalAlpha = 1;

        lightningCtx.shadowBlur = 0;

        lightningAnimation =
            requestAnimationFrame(
                animateLightning
            );

        return;
    }


    lightningCtx.globalAlpha = 1;


    const head =
        lightningTrail[0];


    /* -------------------------------------
       SMALL ELECTRIC SYMBOL
    ------------------------------------- */

    for (
        let i = 0;
        i < GLYPH.length - 1;
        i++
    ) {

        drawLightningBolt(

            {
                x:
                    head.x +
                    GLYPH[i].x,

                y:
                    head.y +
                    GLYPH[i].y
            },

            {
                x:
                    head.x +
                    GLYPH[i + 1].x,

                y:
                    head.y +
                    GLYPH[i + 1].y
            },

            glyphBolts[i] ||
            glyphBolts[0],

            GLYPH_THICKNESS,

            spread * 0.3,

            lightningSettings.glowIntensity,

            0
        );
    }


    lightningCtx.globalAlpha = 1;

    lightningCtx.shadowBlur = 0;


    lightningAnimation =
        requestAnimationFrame(
            animateLightning
        );
}


lightningAnimation =
    requestAnimationFrame(
        animateLightning
    );




// ---------------- About Section Tabs ----------------

let tablinks = document.getElementsByClassName("tablinks");
let tabcontents = document.getElementsByClassName("tabcontents");

function opentab(tabname) {

    for (let tablink of tablinks) {
        tablink.classList.remove("active-link");
    }

    for (let tabcontent of tabcontents) {
        tabcontent.classList.remove("active-tab");
    }

    event.currentTarget.classList.add("active-link");
    document.getElementById(tabname).classList.add("active-tab");
}



// ---------------- Typing Animation ----------------

var typed = new Typed("#element", {
    strings: ["I code in Java, C, Python..."],
    typeSpeed: 70,
    showCursor: true,
    cursorChar: "|",
    loop: false
});


