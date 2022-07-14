// This code is part of JS-Sandpile (https://github.com/huacayacauh/JS-Sandpile/)
// CC-BY Valentin Darrigo, Jeremy Fersula, Kevin Perrot

// ################################################
//
// 	[ 1.0 ]		Produces various measure of the
//				toppling of the Tiling.
//
// ################################################
Tiling.prototype.get_stats = function () {
	var population = {};
	for (var i = 0; i < this.tiles.length; i++) {
		if (!population[this.tiles[i].sand])
			population[this.tiles[i].sand] = 1;
		else
			population[this.tiles[i].sand]++;
	}

	return population;
}

function makeStatsFile(Tiling) {
	var pops = [];

	var done = false;
	var max_sand = 0;
	while (!done) {
		var stat = Tiling.get_stats();
		pops.push(stat);
		Object.keys(stat).forEach(function (key) {
			if (key > max_sand)
				max_sand = key;
		});
		done = Tiling.iterate();
	}
	Tiling.colorTiles();

	var text1 = "" + Tiling.tiles.length + " - " + Tiling.lastChange;
	for (var i = 0; i < pops.length; i++) {
		for (var j = 0; j < max_sand; j++) {
			if (pops[i][j] !== undefined) {
				text1 += pops[i][j] + " ";
			} else {
				text1 += "0 ";
			}
		}
		text1 += "\n"
	}


	var data1 = new Blob([text1], { type: 'text/plain' });

	// If we are replacing a previously generated file we need to
	// manually revoke the object URL to avoid memory leaks.

	if (textFile1 !== null) {
		window.URL.revokeObjectURL(textFile1);
	}


	var textFile1 = window.URL.createObjectURL(data1);

	return textFile1;
}

// ------------------------------------------------
// 	[ 1.1 ] 	Chart
//
// ------------------------------------------------
var listaQtdAvalanches = [];
var listaQtdGraosPerdidos = [];
var listaNumberOfSteps = [0];
var listaQtdGraosTotais = [];

const myChartAvalanches = new Chart(document.getElementById('myChartAvalanches'), {
	type: "line",
	data: {
		labels: listaNumberOfSteps,
		datasets: [{
			fill: false,
			lineTension: 0,
			backgroundColor: "#192f56",
			borderColor: "#345da9",
			data: listaQtdAvalanches
		}]
	},
	options: {
		legend: {
			display: false
		},
		title: {
			display: true,
			text: "Quantidade de avalanches por passos"
		  }
	}
});

const myChartGraosPerdidos = new Chart(document.getElementById('myChartGraosPerdidos'), {
	type: "line",
	data: {
		labels: listaNumberOfSteps,
		datasets: [{
			fill: false,
			lineTension: 0,
			backgroundColor: "#CD1818",
			borderColor: "#ff4c57",
			data: listaQtdGraosPerdidos
		}]
	},
	options: {
		legend: {
			display: false
		},
		title: {
			display: true,
			text: "Quantidade de grãos perdidos por passos"
		  }
	}
});

const myChartGraosTotais = new Chart(document.getElementById('myChartGraosTotais'), {
	type: "line",
	data: {
		labels: listaNumberOfSteps,
		datasets: [{
			fill: false,
			lineTension: 0,
			backgroundColor: "#CD1818",
			borderColor: "#ff4c57",
			data: listaQtdGraosTotais
		}]
	},
	options: {
		legend: {
			display: false
		},
		title: {
			display: true,
			text: "Quantidade de grãos totais no sistema"
		  }
	}
});

// ------------------------------------------------
// 	[ 1.1 ] 	Display various measures
//				of the current Tiling.
//
// ------------------------------------------------
function show_stats() {
	if (currentTiling) {
		var population = currentTiling.get_stats();
		var disp = document.getElementById("statsInfo");

		qtdAvalanches = currentTiling.qtdAvalanches;
		qtdGraosPerdidos = currentTiling.qtdGraosPerdidos;
		qtdGraosTotais = currentTiling.qtdGraosTotais;

		//Chart
		listaQtdAvalanches.push(currentTiling.qtdAvalanches);
		listaQtdGraosPerdidos.push(currentTiling.qtdGraosPerdidos);
		listaQtdGraosTotais.push(get_totalSand());
		listaNumberOfSteps.push(number_of_steps);

		// if (listaNumberOfSteps.length > 5) {
		// 	listaQtdAvalanches.shift();
		// 	listaQtdGraosPerdidos.shift();
		// 	listaNumberOfSteps.shift();
		// };

		myChartAvalanches.update();
		myChartGraosPerdidos.update();
		myChartGraosTotais.update();

		var mean = 0;
		var std = 0;
		for (var i = 0; i < population.length; i++) {
			mean += population[i] * i
		}

		var text_stats = "Número de sítios: " + currentTiling.tiles.length;
		// var text_stats = "Number of tiles : " + currentTiling.tiles.length + "<br>qtdAvalanches : " + qtdAvalanches + "<br>qtdGraosPerdidos : " + qtdGraosPerdidos + "<br>Mean : " + mean + "<br> Standard deviation : " + std + "<br> Population : <br>";
		var jump_line = false;
		Object.keys(population).forEach(function (key) {
			// text_stats += " " + key + " : " + population[key];
			// if(jump_line)
			// 	text_stats += "<br>";
			// else
			// 	text_stats += " - ";
			// jump_line = !jump_line;
		});
		disp.innerHTML = text_stats;
	}
}

// ################################################
//
// 	[ 2.0 ] 	Stats file download
//
//		Same as ImportExport.js [ 2.0 ]
//
// ################################################
handleDownloadStats = function (evt) {

	if (currentTiling === undefined) return
	var link = document.getElementById('downloadlink');

	var textFile = makeStatsFile(currentTiling);

	link.setAttribute('download', "SandpileEvolution.txt");
	link.href = textFile;
	link.click();
}

function download(filename, text) {
	var element = document.createElement('a');
	element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
	element.setAttribute('download', filename);

	element.style.display = 'none';
	document.body.appendChild(element);

	element.click();

	document.body.removeChild(element);
}


// var createStats = document.getElementById('createStats')
// createStats.addEventListener('click', handleDownloadStats, false);