window.Telegram.WebApp.expand();

const config = {
    'lineSize': 5,
    'color': '#007FF9'
}

const NOISE_PX_PERIOD = 20;
const NOISE_PX_DEVIATION = 2;

window.onload = () => {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const indicator = document.getElementById('indicator');
    const pensForm = document.getElementById('Pens')

    const PEN_BRUSH = 'Brush';
    const PEN_LINE = 'Line';
    const PEN_NOISE_LINE = 'NoiseLine';

    var firstDotFlag = false;
    var firstDotX = 0;
    var firstDotY = 0;

    var selectedPen = 'Brush';

    // radio update event
    var rad = document.getElementById('Pens').getElementsByClassName('Pen');
    var prev = null;
    for (var i = 0; i < rad.length; i++) {
        rad[i].addEventListener('change', function() {
            if (this !== prev) {
                prev = this;
            }
            selectedPen = this.value;
            setDefaultFlag();
        });
    }
    // download
    document.getElementById('download').addEventListener('click', function(e) {
        let canvasUrl = canvas.toDataURL();
        const createEl = document.createElement('a');
        createEl.href = canvasUrl;

        createEl.download = "download-this-canvas";

        createEl.click();
        createEl.remove();
    });

    canvas.setAttribute('width', 890);
    canvas.setAttribute('height', 670);

    ctx.lineWidth = config.lineSize;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = config.color;
    ctx.fillStyle = config.color;

    var isRec = false,
        newDraw = false

    var positionsGroups = [];
    var positions = [];

    setBackground();

    canvas.addEventListener("pointerdown", (e) => curDown(e));
    canvas.addEventListener("pointerup", (e) => curUp(e));

    document.getElementById('undo').addEventListener("click", () => undo());
    document.getElementById('clear').addEventListener("click", () => clearDrawing());

    // event functions
    function curDown(e) {
        if (selectedPen === PEN_BRUSH) {
            clearCanvas();
            positions = [];
            canvas.onpointermove = (e) => drawPen(e);
        }
    }

    function curUp(e) {
        if (selectedPen === PEN_BRUSH) {
            canvas.onpointermove = null;
            if ((positions.length !== 0)) {
                positionsGroups.push(positions);
            }
            positions = [];
        }
        else if (selectedPen === PEN_LINE) {
            if (firstDotFlag) {
                firstDotFlag = false;
                positions = [
                    [firstDotX, firstDotY],
                    [e.clientX, e.clientY],
                ];
                positionsGroups.push(positions)
                draw(e.clientX, e.clientY);
            }
            else {
                firstDotFlag = true;
                firstDotX = e.clientX;
                firstDotY = e.clientY;
                ctx.moveTo(e.clientX, e.clientY);
            }
        }
        else if (selectedPen === PEN_NOISE_LINE) {
            if (firstDotFlag) {
                firstDotFlag = false;

                let deltaX =  e.clientX - firstDotX;
                let deltaY =  e.clientY - firstDotY;

                let range = Math.sqrt(Math.pow(deltaX, 2) + Math.pow(deltaY, 2));
                let pointsNum = Math.trunc(range / NOISE_PX_PERIOD);
                let xNoiseRange = deltaX / pointsNum;
                let yNoiseRange = deltaY / pointsNum;

                var points = [];
                for (let i = 1; i < pointsNum; i++) {
                    let x = firstDotX + xNoiseRange * i + randomNoiseNum(NOISE_PX_DEVIATION);
                    let y = firstDotY + yNoiseRange * i + randomNoiseNum(NOISE_PX_DEVIATION)
                    points.push([x, y]);
                }
                points.push([e.clientX, e.clientY]);
                for (let point in points) {
                    draw(points[point][0], points[point][1]);
                }
                positions = [
                    [firstDotX, firstDotY]
                ]
                for (let point in points) {
                    positions.push([points[point][0], points[point][1]])
                }
                positionsGroups.push(positions);
            }
            else {
                firstDotFlag = true;
                firstDotX = e.clientX;
                firstDotY = e.clientY;
                ctx.moveTo(e.clientX, e.clientY);
            }
        }
    }

    function drawPen(e) {
        positions.push([e.clientX, e.clientY]);
        draw(e.clientX, e.clientY);
    }

    // Main draw functions
    function draw(x, y) {
        ctx.lineTo(x, y);
        ctx.stroke();
    }

    function clearCanvas() {
        if(newDraw) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            newDraw = false;
        }
        ctx.beginPath();
    }

    function randomNoiseNum(maxDeviation) {
        let sign = Math.random() < 0.5 ? -1 : 1;
        let abs = Math.random() * maxDeviation;
        return sign * abs;
    }

    function undo() {
        if(positionsGroups.length !== 0) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.beginPath();
            setBackground();
            deleteLast();
        }
    }

    function deleteLast() {
        positionsGroups.pop();
        for (let groupNumber = 0; groupNumber < positionsGroups.length; groupNumber++) {
            let group = positionsGroups[groupNumber];
            ctx.moveTo(group[0][0], group[0][1]);
            for (let dotNumber = 1; dotNumber < group.length; dotNumber++) {
                let dot = group[dotNumber];
                draw(dot[0], dot[1]);
            }
        }
        setDefaultFlag();
    }

    function setDefaultFlag() {
        firstDotFlag = false;
    }

    function setBackground() {
        let img = document.getElementById("sketch");
        ctx.drawImage(img, 0, 0);
    }

    function clearDrawing() {
        positionsGroups = [];
        positions = [];
        setDefaultFlag();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.beginPath();
        setBackground();
    }
}