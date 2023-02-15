const config = {
    'lineSize': 5,
    'color': '#007FF9'
}

const NOISE_PX_PERIOD = 20;
const NOISE_PX_DEVIATION = 2;

window.onload = () => {
    let locationWindow = document.getElementById('locationWindow');
    let locationOpenButton = document.getElementById('selectLocation');
    let locationCloseButton = document.getElementById('closeLocations');

    let helpWindow = document.getElementById('help');
    let helpOpenButton = document.getElementById('openHelp');
    let helpCloseButton = document.getElementById('closeHelp');

    function closeLocations() {
        locationWindow.style.display = "none";
    }

    locationCloseButton.addEventListener("click", () => closeLocations())
    locationOpenButton.addEventListener('click', () => {
        locationWindow.style.display = "flex";
    });

    let nowImage = document.getElementById("sketch");
    let locationItems = locationWindow.getElementsByClassName('locationItem');
    for (let locationItem = 0; locationItem < locationItems.length; locationItem++) {
        locationItems[locationItem].addEventListener('click', function () {
            nowImage = this.getElementsByClassName('locationPreview')[0];
            clearDrawing();
            closeLocations();
        });
    }

    helpCloseButton.addEventListener("click", () => {
        helpWindow.style.display = "none";
    })
    helpOpenButton.addEventListener('click', () => {
        helpWindow.style.display = "flex";
    });

    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const indicator = document.getElementById('indicator');
    const pensForm = document.getElementById('Pens');

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

    if (window.innerWidth * (670 / 890) < window.innerHeight) {
        document.getElementById('control').style.width = window.innerWidth - 100 + 'px'
        canvas.setAttribute('width', window.innerWidth - 100);
        canvas.setAttribute('height', (window.innerWidth - 100) * (670 / 890));
    }
    else {
        document.getElementById('control').style.width = (window.innerHeight - 100) * (890 / 670) + 'px'
        canvas.setAttribute('width', (window.innerHeight - 100) * (890 / 670));
        canvas.setAttribute('height', window.innerHeight - 100);
    }

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
                    [getXInCanvas(e), getYInCanvas(e)],
                ];
                positionsGroups.push(positions)
                draw(getXInCanvas(e), getYInCanvas(e));
            }
            else {
                firstDotFlag = true;
                firstDotX = getXInCanvas(e);
                firstDotY = getYInCanvas(e);
                ctx.moveTo(getXInCanvas(e), getYInCanvas(e));
            }
        }
        else if (selectedPen === PEN_NOISE_LINE) {
            if (firstDotFlag) {
                firstDotFlag = false;

                let deltaX =  getXInCanvas(e) - firstDotX;
                let deltaY =  getYInCanvas(e) - firstDotY;

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
                points.push([getXInCanvas(e), getYInCanvas(e)]);
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
                firstDotX = getXInCanvas(e);
                firstDotY = getYInCanvas(e);
                ctx.moveTo(getXInCanvas(e), getYInCanvas(e));
            }
        }
    }

    function drawPen(e) {
        positions.push([getXInCanvas(e), getYInCanvas(e)]);
        draw(getXInCanvas(e), getYInCanvas(e));
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
        if (window.innerWidth * (670 / 890) < window.innerHeight) {
            ctx.drawImage(nowImage, 0, 0, window.innerWidth - 100, (window.innerWidth - 100) * (670 / 890));
        }
        else {
            ctx.drawImage(nowImage, 0, 0, (window.innerHeight - 100) * (890 / 670), window.innerHeight - 100);
        }
    }

    function clearDrawing() {
        positionsGroups = [];
        positions = [];
        setDefaultFlag();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.beginPath();
        setBackground();
    }

    function getXInCanvas(e) {
        return e.clientX - canvas.getBoundingClientRect().x;
    }

    function getYInCanvas(e) {
        return e.clientY - canvas.getBoundingClientRect().y;
    }
}