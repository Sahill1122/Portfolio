
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


