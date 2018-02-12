

// all testing done on latest chrome browser {Version 64.0.3282.119 (Official Build) (64-bit)}

function cleanUp () { // helps in clean up process
	d3.selectAll("table.tbody.tr").remove(); // removing all the table data on clean up
	d3.select("#piechart").selectAll("g").remove(); // removing all pie chart elements on clean up
	d3.select("table").attr("style", "visibility: hidden"); // hiding the empty table
	d3.select("#fileUserSize").selectAll("text").text(""); // removing file size text display field
}

function parseFile() {
	const input = document.getElementById("myFile"); // takes in the file uploaded and passes it to parse the file
  	if ('files' in input && input.files.length > 0) {
		readFileContent(document.getElementById('data'), input.files[0]); // reads the file and then processes the file
  	}
}

function readFileContent(target, file) {
	var lines;
	if (!file) { 
		cleanUp();
		writelog("Failed to load file");
		alert("Failed to load file");
    } 
    else if (!file.name.match('.log')) { // assuming the log files are always of the extension .log
    	cleanUp();
    	writelog(file.name + " is not a valid .log file");
	    alert(file.name + " is not a valid .log file");
    } 
    else {
    	try{
	    	let fileReader = new FileReader();
			fileReader.onload = function (event) {
				var contents = event.target.result;
				lines = contents.split("\n");
			
				analyzeData(target, lines); // analyses the parsed file inorder to calculate the stats
			}
			fileReader.readAsText(file);
		}
		catch(error){ // handling exceptions due to file reader // might be caused due to browser not supporting
			cleanUp();
			alert("FileReader error");
			writelog("FileReader error: "+ error);
		}
	}
}

function analyzeData(target, lines)
{
	d3.selectAll("table.tbody.tr").remove(); // flushing all the table fields on a new file upload
	let data = {}, final = [], finalArryIndex = 0;

	if(!lines) {
		cleanUp();
		writelog("FileEmpty");
	}
	else
	{
		try{
			let headers = [], headerIndex = 0, lineno = 0, nameField = 6;
			for(let i of lines)
			{
				lineno++;
				let line; 
				if(i[0] === "#") // log file headers which starts with '#'
				{
					line = i.split(' ');
					if(line[0].toUpperCase() === "#FIELDS:") // if header starts with #Fields: finding the index of cs-userdn column
					{
						let nameIndex = -1;
						for (let ittr = 1; ittr < line.length; ittr++)
						{
							if(line[ittr].toUpperCase() === "CS-USERDN")
							{
								nameIndex = ittr - 1;
								break;
							}
						}
						if(nameIndex >= 0)
							nameField = nameIndex;
					}
					continue;
				}
				line = i.split(' ', (nameField+2));

				if(line.length < (nameField+2))
				{
					writelog("Error in log file line #:" + lineno + "\nSkipping the line");
					continue;
				}
				if(line[nameField] == undefined)
					continue;
				if(data[line[nameField]])
					data[line[nameField]]++;
				else
					data[line[nameField]] = 1;
			}
			
			if(Object.keys(data).length <= 0) // if the log file has no data other than headers
			{
				cleanUp();
				writelog("File has no data");
				return;
			}

			let totalPageViews = 0;

			for (let i in data){
				let string = i;
				string = i[0].toUpperCase(); // making the first letter of username CAPS
				string += i.substring(1, i.length);
				totalPageViews += data[i];
				final[finalArryIndex++] = {"key": string, "count": data[i]}; // each user now has an object associated
			}
			
			final.sort(function(a, b) { // sorting the users in descending order
				if(parseInt(b.count) - parseInt(a.count) == 0)
					return b.key - a.key;
				return parseInt(b.count) - parseInt(a.count);
			})

			let totalUser = final.length;

			let limiter = 25; // pie chart becomes clumsy on last number of slices // limiting the number
			let num = document.getElementById('number').value; // user entered number
			
			if(num < 0) // checking if user inputed a negative number
			{
				num = 20 > final.length ? final.length : 20;
				alert("negative number inputted; default value used" + num);
				writelog("negative number inputted; default value used" + num);
			}

			if(num > final.length) // notifying user that the value entered is more than the total and therefore limiting it
			{
				alert("the number entered is larger than the user count\nusing the max number of users: " + final.length);
				writelog("the number entered is larger than the user count\nusing the max number of users: " + final.length);
			}

			if(num) // checking if the number set by user is more than the actual data size
				limiter = num > final.length ? final.length : num;

			if(final.length > limiter) // clubbing the rest of the users into 'others' tag
			{
				let trimFinal = [];
				for(let i = 0; i < limiter; i++)
				{
					trimFinal[i] = Object.assign({}, final[i]);
				}
				
				trimFinal[limiter] = {"key": "~~~~~ Others ~~~~~", "count": 0};
				
				for(let i = limiter; i < final.length; i++)
				{
					trimFinal[limiter].count += final[i].count;
				}
				final = trimFinal;
			}
		
			let table = new Table(totalUser)
			table.createTable(final) // creating a table for the calculated values
		
			let chart = new PiChart(totalPageViews)
			chart.createChart(final) // creating pichart for the calculated values
		} catch(error) {
			cleanUp();
			writeLog("Error encountered during file parse: " + error);
		}
	}
}

class Table {
	constructor(data)
	{
		this.table = d3.select("table");
		this.table.attr("style", "visibility: visible");
		d3.select("#fileUserSize").selectAll("text").text(d=>"Total Number of Users: " + data);
	}

	createTable(data)
	{
		let tr = this.table.select("tbody").selectAll("tr").data(data);
		let newTr = tr.enter().append("tr");
		tr.exit().remove();
		tr = newTr.merge(tr);

		let td = tr.selectAll("td").data(d=>[d.key, d.count]);
		let newTd = td.enter().append("td");
		td.exit().remove();
		td = newTd.merge(td);

		td.text(d=>d);
	}
}

class PiChart
{
	constructor(data)
	{
		this.chart = d3.select("#piechart");
		let width = this.chart.node().getBoundingClientRect().width;
		let height = this.chart.node().getBoundingClientRect().height;
		this.outerRadius = Math.min(width, height) * 0.5 - 40;
		this.radius = Math.min(width, height) / 2 - 20;
		this.chart.append("g").attr("class", "piChart").attr("transform", "translate(" + (width / 2 + 10) + "," + height / 2 + ")");
		this.totalPageViews = data;

	}

	createChart(data)
	{
		let _this = this;
		let index = 0;
		let radiusLabel = _this.radius - _this.radius / 4;

		// helps color scale the pie tiles
		function colorPicker(d) {
		  var colors = ["#3366cc", "#dc3912", "#ff9900", "#109618", "#990099", "#0099c6", "#dd4477", "#66aa00", "#b82e2e", "#316395", "#994499", "#22aa99", "#aaaa11", "#6633cc", "#e67300", "#8b0707", "#651067", "#329262", "#5574a6", "#3b3eac"];
		  return colors[d % colors.length];
		}

		// pie chart settings
		let path = d3.arc().innerRadius(_this.radius / 8).outerRadius(_this.radius - _this.radius / 4);
		let label = d3.arc().innerRadius(radiusLabel).outerRadius(radiusLabel);
		let pie = d3.pie().value(function(d) {
		  return d.count;
		})
		.sort(null)
		.startAngle(-10 * (Math.PI/180))
        .endAngle(350 * (Math.PI/180));

		function midAngle(d){
			return d.startAngle + (d.endAngle - d.startAngle)/2;
		}

		/* Draw PiChart*/
		let arc =  	this.chart.select(".piChart").selectAll(".arc").data(pie(data));
		let newArc = arc.enter().append("g");

		arc.exit().remove();
		arc = newArc.merge(arc);
		arc.attr("class", "arc")
			.on("mouseover", function(e) {
				d3.selectAll(".arc").attr("style", "opacity: 0.3;");
				d3.select(this).style("opacity", 1).append("title").text( (e.data.count/_this.totalPageViews * 100).toFixed(2) +"%");
			})
			.on("mouseout", function(e) {
				d3.selectAll(".arc").attr("style", "opacity: 1");
				d3.select(this).select("title").remove();
			});

		let pathArc = arc.selectAll("path").data(function(d){return d3.select(this).data();});
		let newPath = pathArc.enter().append("path");

		pathArc.exit().remove();
		pathArc = newPath.merge(pathArc);

		pathArc.attr("d", path)
			.attr("fill", function(d) {	return colorPicker(index++); });

		/*Write Labels corresponding to the pie slices*/
		let text = arc.selectAll("text").data(function(d){return d3.select(this).data();});
		let newText = text.enter().append("text");

		text.exit().remove();
		text = newText.merge(text);

		text.text(function(d) {
			  return d.data.key;
			})
			.style("text-anchor", function(d) {
			  return midAngle(d) > Math.PI? "end": "start";
			})
			.attr("d", label)
			.attr("transform", function(d) {
					var position = label.centroid(d);
					if(midAngle(d) > Math.PI)
						position[0] -= 40;
					else
						position[0] +=  40;
					position[1] += 2;
					return "translate(" + position + ")";
			 });
			
		/* Drawing lines connecting Labels to Pie Slices */
		let polyline = arc.selectAll("polyline").data(function(d){return d3.select(this).data();});
		let newline = polyline.enter().append("polyline");

		polyline.exit().remove();
		polyline = newline.merge(polyline);

		polyline.attr("points", function(d) {
				    let position = label.centroid(d);
				    if(midAngle(d) > Math.PI)
						position[0] -= 40;
					else
				   		position[0] += 40;
				    return [path.centroid(d), label.centroid(d), position];
				});
	};

}

function displayLog(checkboxElem) {
  if (checkboxElem.checked) {
    d3.select("#log").style("visibility", "visible");
  } else {
    d3.select("#log").style("visibility", "hidden");
  }
}

function createLog()
{
	let log = d3.select("#log").selectAll("text").data([""]);
	d3.select("#fileUserSize").append("text");
	writelog("Log:")
}

window.onbeforeunload = function(e) {
	d3.select("#log").selectAll("p").remove();
};

function writelog(data)
{
	let log = d3.select("#log").append("p").html(data); // writing to the log section
}

function displayUsers(data){
}