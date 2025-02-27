// This code is part of JS-Sandpile (https://github.com/huacayacauh/JS-Sandpile/)
// CC-BY Valentin Darrigo, Jeremy Fersula, Kevin Perrot

// ################################################
//
// 	[ 1.0 ] 	Main class of the application
//			
//		Creates the THREE.js canvas containing
//		the interesting part of the app.
//
// ################################################
class App {

	constructor() {

		// Display
		var container = document.getElementById("canvasHolder");
		this.WIDTH = container.clientWidth - 10;
		this.HEIGHT = container.clientHeight - 10;

		this.scene = new THREE.Scene();
		this.ratio = this.WIDTH / this.HEIGHT;

		this.renderer = new THREE.WebGLRenderer();
		this.renderer.setSize(this.WIDTH, this.HEIGHT);
		container.appendChild(this.renderer.domElement);

		// Controls
		var left = -this.WIDTH / 4.5;
		var right = this.WIDTH / 4.5;
		var top_cam = this.HEIGHT / 4.5;
		var bottom = -this.HEIGHT / 4.5;

		this.camera = new THREE.OrthographicCamera(left, right, top_cam, bottom, 0, 10);
		this.camera.position.z = 5;

		this.controls = new THREE.OrthographicTrackballControls(this.camera, this.renderer.domElement); //OK

		this.controls.enablePan = true;
		this.controls.enableZoom = true;
		this.controls.enableRotate = false;
	}

	// ------------------------------------------------
	// 	[ 1.1 ] 	Re-sizing of the Canvas
	// ------------------------------------------------

	reset_size() {
		var container = document.getElementById("canvasHolder");
		this.WIDTH = container.clientWidth - 10;
		this.HEIGHT = container.clientHeight - 10;

		this.ratio = this.WIDTH / this.HEIGHT;

		var left = -this.WIDTH / 4.5;
		var right = this.WIDTH / 4.5;
		var top_cam = this.HEIGHT / 4.5;
		var bottom = -this.HEIGHT / 4.5;
		this.camera.left = left;
		this.camera.right = right;
		this.camera.top = top_cam;
		this.camera.bottom = bottom;

		this.camera.updateProjectionMatrix();
		this.renderer.setSize(this.WIDTH, this.HEIGHT);
	}
}


// ################################################
//
// 	[ 2.0 ]		Application state variables
//			
//		Shared and used between many files
//
// ################################################

var cmap = []; // default

var play = false;

var currentTiling;

var app = new App();

var it_per_frame = 1;

var delay = 100;

var selectedTile;

var savedConfigs = [];

var wireFrameEnabled = false;

var number_of_steps = 0; // count the number of steps (manually reset by user)
reset_number_of_steps();

// ---------------------- Less important variables

var color_hue_shift = 0.0; // Animation of selected tile color

var color_select = new THREE.Color(); // Animation of selected tile color

var tileInfo = document.getElementById("tileInfo");

var check_copy = true; // Copy the tiling once in a while to see if it is stable

// ---------------------- Routines

setInterval(colorSelected, 200); //		[ 4.2 ]

setInterval(refresh_zoom, 200); // 		[ 5.2 ]

// ---------------------- Events

window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {
	app.reset_size();
}

// ################################################
//
// 	[ 3.0 ]		Tiling manipulation controls
//			
//		See Tiling.js [ 2.0 ]
//
// ################################################

// ------------------------------------------------
// [ 3.0 ] number_of_steps set/reset
//         incremented in [ 3.1 ] and [ 3.2 ]
// ------------------------------------------------

function reset_number_of_steps() {
	number_of_steps = 0;
	document.getElementById("number_of_steps").innerHTML = number_of_steps;
}

function increment_number_of_steps() {
	show_stats();
	number_of_steps++;
	document.getElementById("number_of_steps").innerHTML = number_of_steps;
}

// ------------------------------------------------
// 	[ 3.1 ] 	Apply one sandpile step
//		Tiling.js [ 2.2 ] [ 2.6 ]
// ------------------------------------------------
function step() {
	if (currentTiling) {
		currentTiling.iterate();
		console.log('teste');
		increment_number_of_steps();
		currentTiling.colorTiles();
		get_totalSand();
		if (selectedTile)
			tileInfo.innerHTML = "Tile index : " + selectedTile + "<br>Sand : " + currentTiling.tiles[selectedTile].sand;
	}
}

function steps() {
	// get number of steps
	let n = document.getElementById("stepsRepeat") ? document.getElementById("stepsRepeat").valueAsNumber : 1;
	if (currentTiling) {
		let is_stable = false;
		// perform n steps
		// debugger;
		for (let i = 0; i < n && !is_stable; i++) {
			currentTiling.iterate();
			increment_number_of_steps();
		}
		currentTiling.colorTiles();
		if (selectedTile)
			tileInfo.innerHTML = "Tile index : " + selectedTile + "<br>Sand : " + currentTiling.tiles[selectedTile].sand;
	}
}

// ------------------------------------------------
// 	[ 3.2 ] 	Apply multiple steps and color
//		Tiling.js [ 2.2 ] [ 2.6 ]
// ------------------------------------------------
function iterateTiling() {
	var is_stable = false;
	for (var i = 0; i < it_per_frame; i++) {
		is_stable = currentTiling.iterate();
		if (!is_stable) {
			increment_number_of_steps()
		}
	}

	// Comentado para evitar pausa automática
	// if (document.getElementById("pauseToggle").checked && is_stable)
	// 	playPause(document.getElementById("playButton"));
	currentTiling.colorTiles();
	// if (document.getElementById("addRadomToggle").checked)
	// 		addRadomSand();
	// if (selectedTile)
	// 	tileInfo.innerHTML = "Tile index : " + selectedTile + "<br>Sand : " + currentTiling.tiles[selectedTile].sand;

}


// ------------------------------------------------
// 	[ 3.3 ] 	Stabilize the current Tiling
//		Tiling.js [ 2.5 ]
// ------------------------------------------------
function stabTiling() {
	
	if (currentTiling) {
		currentTiling.stabilize();
	}

	if (selectedTile)
		tileInfo.innerHTML = "Tile index : " + selectedTile + "<br>Sand : " + currentTiling.tiles[selectedTile].sand;
}


// ------------------------------------------------
// 	[ 3.4 ] 	Empty the Tiling
//		Tiling.js [ 2.4 ]
// ------------------------------------------------
function clearTiling() {
	if (currentTiling) {
		currentTiling.clear();
	}
}

// ------------------------------------------------
// 	[ 3.5 ] 	Adding, Subtracting and setting
//				complex operations over the
//				current Tiling.
//		
//		This section could be improved ...
//
//		Tiling.js [ 2.3 ] [ 2.4 ] [ 2.5 ]
//
// ------------------------------------------------
function complexOperationAdd() {
	// Apply the selected operation, additively

	if (currentTiling) {

		currentTiling.lastChange = 0;
		var operationType = document.getElementById("complexOperationValue").value;
		var operationTimes = document.getElementById("complexOperationRepeat").valueAsNumber;
		switch (operationType) {
			case "OneE":
				currentTiling.addEverywhere(operationTimes);
				break;

			case "MaxS":
				for (var i = 0; i < operationTimes; i++)
					currentTiling.addMaxStable();
				break;

			case "Rand":
				currentTiling.addRandom(operationTimes);
				break;

			case "Dual":
				currentTiling.addConfiguration(currentTiling.getHiddenDual());
				break;

			case "Iden":
				for (var i = 0; i < operationTimes; i++)
					currentTiling.addConfiguration(currentTiling.get_identity());
				break;
			case "Inve":
				currentTiling.addConfiguration(currentTiling.get_inverse());
				break;
		}
		if (operationType.substring(0, 4) == "CNFG") {
			for (var i = 0; i < operationTimes; i++)
				currentTiling.addConfiguration(savedConfigs[operationType.substring(4, operationType.length)]);
		}
	}

	if (selectedTile)
		tileInfo.innerHTML = "Tile index : " + selectedTile + "<br>Sand : " + currentTiling.tiles[selectedTile].sand;
}

// feat_corringo_app
function addRadomSand(limitSand=4) {
	var operationTimes = 1;
	currentTiling.addRandom(operationTimes, limitSand);
}

function complexOperationSet() {
	// Apply the selected operation, and set the Tiling accordingly

	if (currentTiling) {
		currentTiling.lastChange = 0;
		var operationType = document.getElementById("complexOperationValue").value;
		var operationTimes = document.getElementById("complexOperationRepeat").valueAsNumber;
		switch (operationType) {
			case "OneE":
				currentTiling.clear();
				currentTiling.addEverywhere(operationTimes);
				break;

			case "MaxS":
				currentTiling.clear();
				for (var i = 0; i < operationTimes; i++)
					currentTiling.addMaxStable();
				break;

			case "Rand":
				currentTiling.clear();
				currentTiling.addRandom(operationTimes);
				break;

			case "Dual":
				let newTilingDual = currentTiling.getHiddenDual();
				currentTiling.clear();
				currentTiling.addConfiguration(newTilingDual);
				break;

			case "Iden":
				currentTiling.clear();
				for (var i = 0; i < operationTimes; i++)
					currentTiling.addConfiguration(currentTiling.get_identity());
				break;

			case "Inve":
				let newTilingInve = currentTiling.get_inverse();
				currentTiling.clear();
				currentTiling.addConfiguration(newTilingInve);
				break;
		}
		if (operationType.substring(0, 4) == "CNFG") {
			currentTiling.clear();
			for (var i = 0; i < operationTimes; i++)
				currentTiling.addConfiguration(savedConfigs[operationType.substring(4, operationType.length)]);
		}
	}

	if (selectedTile)
		tileInfo.innerHTML = "Tile index : " + selectedTile + "<br>Sand : " + currentTiling.tiles[selectedTile].sand;
}

function complexOperationSub() {
	// Apply the selected operation, subtractively

	if (currentTiling) {
		currentTiling.lastChange = 0;
		var operationType = document.getElementById("complexOperationValue").value;
		var operationTimes = document.getElementById("complexOperationRepeat").valueAsNumber;
		switch (operationType) {
			case "OneE":
				currentTiling.removeEverywhere(operationTimes);
				break;

			case "MaxS":
				for (var i = 0; i < currentTiling.tiles.length; i++) {
					currentTiling.remove(i, (currentTiling.tiles[i].limit - 1) * operationTimes);
				}
				currentTiling.colorTiles();
				break;

			case "Rand":
				currentTiling.removeRandom(operationTimes);
				break;

			case "Dual":
				currentTiling.removeConfiguration(currentTiling.getHiddenDual());
				break;

			case "Iden":
				for (var i = 0; i < operationTimes; i++)
					currentTiling.removeConfiguration(currentTiling.get_identity());
				break;

			case "Inve":
				currentTiling.removeConfiguration(currentTiling.get_inverse());
				break;
		}
		if (operationType.substring(0, 4) == "CNFG") {
			for (var i = 0; i < operationTimes; i++)
				currentTiling.removeConfiguration(savedConfigs[operationType.substring(4, operationType.length)]);
		}
	}

	if (selectedTile)
		tileInfo.innerHTML = "Tile index : " + selectedTile + "<br>Sand : " + currentTiling.tiles[selectedTile].sand;
}

// ################################################
//
// 	[ 4.0 ]		Tiling display controls
//			
//		See Tiling [ 2.0 ]
//
// ################################################

// ------------------------------------------------
// 	[ 4.1 ] 	Main play function
// ------------------------------------------------
async function playWithDelay() {
	if (currentTiling) {
		while (true) {
			if (play) {
				iterateTiling();
			}else{
				break;
			}
			await sleep(delay);
		}
	}
}

// ------------------------------------------------
// 	[ 4.2 ] 	Either play, or pause
// ------------------------------------------------
function playPause(elem) {
	if (play) {
		play = false;
		elem.innerHTML = "Automático";
		elem.style.backgroundColor = "#4464AD";
		document.getElementById("btn-passo").style.display = 'inline';
	} else {
		play = true;
		playWithDelay();
		elem.innerHTML = "Manual";
		elem.style.backgroundColor = "#6ab99d";
		document.getElementById("btn-passo").style.display = 'none';
	}
}

// ------------------------------------------------
// 	[ 4.3 ] 	Shift hue of selected tile
//			
//			Called by a routine.
// ------------------------------------------------
function colorSelected() {
	if (currentTiling) {
		if (!play) {
			color_hue_shift += 0.05;
			color_hue_shift = color_hue_shift % 1.0;
			if (currentTiling.selectedIndex >= 0) {
				color_select.setHSL(color_hue_shift, 1.0, 0.5);
				currentTiling.colorTile(currentTiling.selectedIndex, color_select);
			}
		}
	}
}

// ------------------------------------------------
// 	[ 4.4 ] 	Display border of tiles.
// ------------------------------------------------
function enableWireFrame(elem) {
	if (currentTiling) {
		if (currentTiling.wireFrame) {
			if (elem.checked) {
				app.scene.add(currentTiling.wireFrame);
				wireFrameEnabled = true;
			}
			else {
				app.scene.remove(currentTiling.wireFrame);
				wireFrameEnabled = false;
			}
		}
	}

}

// ------------------------------------------------
// 	[ 4.5 ] 	Draws currentTiling on
//				the THREE.js Canvas.
//
//		App.js [ 1.0 ]
// ------------------------------------------------
function drawTiling() {
	//Evita que crie uma matriz sem tamanho selecionado
	if(document.getElementById('tamanho').value === 'default'){
		alert('Selecione um tamanho para a matriz!');
		return false;
	}

	while (app.scene.children.length > 0) {
		app.scene.remove(app.scene.children[0]);
		console.log("cleared");
	}

	check_stable = 0;

	cW = document.getElementById("cW").value;
	cH = document.getElementById("cH").value;

	var size = document.getElementById("size").value;

	selectedTile = null;

	// feat_corrigindo_app
	preset = document.getElementById("TilingSelect") ? document.getElementById("TilingSelect").value : 'sqTiling';

	var nbIt = document.getElementById("penroseIt").value;

	var command = "currentTiling = Tiling." + preset + "({height:cH, width:cW, iterations:nbIt, size:size})";

	console.log("BEGIN construct a new Tiling");
	eval(command);
	console.log("END construct a new Tiling");
	console.log("INFO the current Tiling has " + currentTiling.tiles.length + " tiles");

	currentTiling.cmap = cmap;

	app.controls.zoomCamera();
	app.controls.object.updateProjectionMatrix();

	app.scene.add(currentTiling.mesh);

	currentTiling.colorTiles();
	//console.log(currentTiling);

	enableWireFrame(document.getElementById("wireFrameToggle"));

	//playWithDelay();

	var render = function () {
		requestAnimationFrame(render);
		app.controls.update();
		app.renderer.render(app.scene, app.camera);
	};
	render();
}

function redraw() {
	while (app.scene.children.length > 0) {
		app.scene.remove(app.scene.children[0]);
		console.log("cleared");
	}

	check_stable = 0;

	cW = document.getElementById("cW").value;
	cH = document.getElementById("cH").value;

	var size = document.getElementById("size").value;

	selectedTile = null;

	var nbIt = document.getElementById("penroseIt").value;

	currentTiling.cmap = cmap;

	app.controls.zoomCamera();
	app.controls.object.updateProjectionMatrix();

	app.scene.add(currentTiling.mesh);

	currentTiling.colorTiles();
	//console.log(currentTiling);

	enableWireFrame(document.getElementById("wireFrameToggle"));

	playWithDelay();

	var render = function () {
		requestAnimationFrame(render);
		app.controls.update();
		app.renderer.render(app.scene, app.camera);
	};
	render();
}

// ################################################
//
// 	[ 5.0 ]		Misc Functions
//
// ################################################

// ------------------------------------------------
// 	[ 5.1 ] 	JS implementation of sleep
// ------------------------------------------------
function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

// ------------------------------------------------
// 	[ 5.2 ] 	Refresh the zoom according to
//				the html element.
//
//			Called by a routine.
// ------------------------------------------------
function refresh_zoom() {
	if (app)
		document.getElementById("zoomLevel").value = Math.round(app.camera.zoom * 100);
}

// ------------------------------------------------
// 	[ 5.3 ] 	Locally saves tiling
// ------------------------------------------------
function saveConfiguration() {
	if (currentTiling) {
		var config_name = prompt("Enter configuration name : ", "Configuration " + savedConfigs.length);
		if (config_name == null || config_name == "") {
			return;
		}
		document.getElementById("complexOperationValue").innerHTML += '<option value="CNFG' + savedConfigs.length + '">' + config_name + '</option>';

		savedConfigs.push(currentTiling.hiddenCopy());
	}
}


// ################################################
//
// 	[ 6.0 ]		Mouse Click
//			
//		See Tiling 
//
// ################################################


var mouse = new THREE.Vector2(); // un Vector2 contient un attribut x et un attribut y
var raycaster = new THREE.Raycaster(); // rayon qui va intersecter la pile de sable

app.renderer.domElement.addEventListener('mousemove', function (event) {
	if (holdMouse) {
		CanvasClick(event, false);
	}
}, false);


app.renderer.domElement.addEventListener('mousedown', function (event) {
	CanvasClick(event, true);
}, false);


function CanvasClick(event, force) {


	//on calcule un ration entre -1 et 1 pour chaque coordonées x et y du clique
	//si mouse.x == -1 alors on a cliqué tout à gauche
	//si mouse.x ==  1 alors on a cliqué tout à droite
	//si mouse.y == -1 alors on a cliqué tout en bas
	//si mouse.y ==  1 alors on a cliqué tout en haut
	var rect = app.renderer.domElement.getBoundingClientRect(); // correction de la position de la souris par rapport au canvas

	mouse.x = ((event.clientX - rect.left) / app.WIDTH) * 2 - 1;
	mouse.y = - ((event.clientY - rect.top) / app.HEIGHT) * 2 + 1;

	// on paramète le rayon selon les ratios et la camera
	raycaster.setFromCamera(mouse, app.camera);
	// l'objet intersects est u tableau qui contient toutes les faces intersectés par le rayon

	if (app.scene.children.length > 0) {

		var intersects = raycaster.intersectObject(app.scene.children[0]);

		if (intersects.length > 0) {

			var face = intersects[0];
			var triangleIndex = face.faceIndex;
			var nbTimes = document.getElementById("mouseOperationRepeat").valueAsNumber;

			var mouseTODO = document.getElementById("mouseOperation").value;
			previousTile = lastTile;
			lastTile = currentTiling.indexDict[face.faceIndex * 3];
			if (!force && previousTile == lastTile)
				return
			switch (mouseTODO) {
				case "rmOne":
					currentTiling.lastChange = 0;
					var brush_t = zone(lastTile, document.getElementById("brushRange").value)
					for (var k = 0; k < brush_t.length; k++) {
						currentTiling.remove(brush_t[k], nbTimes);
					}
					break;

				case "setOne":
					currentTiling.lastChange = 0;
					var brush_t = zone(lastTile, document.getElementById("brushRange").value)
					for (var k = 0; k < brush_t.length; k++) {
						currentTiling.set(brush_t[k], nbTimes);
					}
					break;

				case "select":
					if (currentTiling.selectedIndex)
						currentTiling.colorTile(currentTiling.selectedIndex);
					selectedTile = lastTile;

					console.log(currentTiling.tiles[selectedTile]);
					// tileInfo.innerHTML = "Tile index : " + selectedTile + "<br>Sand : " + currentTiling.tiles[selectedTile].sand;
					currentTiling.selectedIndex = currentTiling.indexDict[face.faceIndex * 3];
					break;

				default:
					currentTiling.lastChange = 0;
					// currentTiling.add(lastTile, nbTimes);
					var brush_t = zone(lastTile, document.getElementById("brushRange").value)
					for (var k = 0; k < brush_t.length; k++) {
						currentTiling.add(brush_t[k], nbTimes);
					}
					break;
			}

		}
	}
}

app.renderer.domElement.onmousedown = function () {

	holdMouse = true;

}

document.body.onmouseup = function () {
	holdMouse = false;

}

function depth_first(index, size, shared = []) {
	if (size == 0)
		return []
	if (!shared.includes(index))
		shared.push(index);
	for (var i = 0; i < currentTiling.tiles[index].neighbors.length; i++) {
		if (!shared.includes(currentTiling.tiles[index].neighbors[i]))
			shared.push(currentTiling.tiles[index].neighbors[i]);
	}
	for (var i = 0; i < currentTiling.tiles[index].neighbors.length; i++) {
		depth_first(currentTiling.tiles[index].neighbors[i], size - 1, shared)
	}
	return shared
}

function zone(index, size) {
	if (size == 1) {
		return [index];
	} else {
		return depth_first(index, size - 1);
	}
}

var holdMouse = false;
var lastTile = 0;
var previousTile = -1;


///Function (matriz_aleatoria) that gets a random number of sand grains
///and randomly adds them to a matrix, based on the Height and Width parameters

var totalSand = 0;

function matriz_aleatoria() {
	//Evita que crie uma matriz sem tamanho selecionado
	if(document.getElementById('tamanho').value === 'default'){
		alert('Selecione um tamanho para a matriz!');
		return false;
	}

	cW = document.getElementById("cW").value;
	cH = document.getElementById("cH").value;

	//Evita que matriz ultrapasse o limite
	if(cW > 50 || cH > 50){
		alert('Os tamanhos de largura e altura não podem passar de 50!');
		return false;
	}

	if(cW <= 0 || cH <= 0){
		alert('Os tamanhos de largura e altura não podem ser zero ou negativo!');
		return false;
	}

	delay = document.getElementById("delay").value;

	drawTiling();

	i = 0;
	randNum = Math.floor(Math.round(Math.random() * (cW * cH * 4)));
	///randNum holds the random number of grains that the loop is going to add to the matrix

	while ( i <= randNum ) {
		addRadomSand(3);
		i++;
	}
	reset_number_of_steps();
	limparGraficos();
}

function limparGraficos(){
	//Quantidade de avalanches
	myChartAvalanches.data.labels.length = 1;
	myChartAvalanches.data.datasets.forEach((dataset) => {
		dataset.data.length = 1;
	});
	myChartAvalanches.update();

	//Quantidade de avalanches totais
	myChartAvalanchesTotais.data.labels.length = 1;
	myChartAvalanchesTotais.data.datasets.forEach((dataset) => {
		dataset.data.length = 1;
	});
	myChartAvalanchesTotais.update();
}

function selecionarTamanho(elem){
	let tamanho = elem.value;
	let largura = 0;
	let altura = 0;
	let display = '';
	switch (tamanho){
		case 'pequena':
			largura = altura = 5;
			display = 'none';
			app.camera.zoom = 17.2; // Equivale a 1020% de zoom
			break;
		case 'media':
			largura = altura = 20;
			display = 'none';
			app.camera.zoom = 9.5; // Equivale a 350% de zoom
			break;
		case 'grande':
			largura = altura = 50;
			display = 'none';
			app.camera.zoom = 4.5; // Equivale a 200% de zoom
			break;
		case 'personalizado':
			largura = altura = 10;
			display = 'flex';
			break;
		default:
			largura = altura = 10;
			display = 'none';
			break;
	}
	document.getElementById("cW").value = largura;
	document.getElementById("cH").value = altura;
	document.getElementById('div-inputs-tamanho').style.display = display;

}

function get_totalSand() {
	totalSand = 0;
	var qtd = 0;
	var arrayArrayTiles = currentTiling.tiles;
	for (var i = 0; i < arrayArrayTiles.length; i += 1){
		qtd = qtd + arrayArrayTiles[i].sand;
	}
	totalSand = qtd;
	return totalSand;
}