
function parseFile() {
	const input = document.getElementById("myFile");
  if ('files' in input && input.files.length > 0) {
	readFileContent(document.getElementById('data'), input.files[0]);
  }
}

function readFileContent(target, file) {
	var lines;
	if (!file) {
        alert("Failed to load file");
    } 
    else if (!file.name.match('.log')) {
		    alert(file.name + " is not a valid text file.");
    } 
    else {
    	let fileReader = new FileReader();
		fileReader.onload = function (event) {
			var contents = event.target.result;
			lines = contents.split("\n");
			//target.value = lines.length;
			analyzeData(target, lines);
		}
		fileReader.readAsText(file);
	}
}

function analyzeData(target, lines)
{
	d3.selectAll("table.tbody.tr").remove();
	let data = {}, final = [], k = 0;

	if(!lines) {
		alert("File empty");
	}
	else
	{
		for(let i of lines)
		{
			if(i[0] === "#")
			continue;
			let line = i.split(' ', 8);
			if(line[6] == undefined)
				continue;
			if(data[line[6]])
				data[line[6]]++;
			else
				data[line[6]] = 1;
		}

		for (let i in data){
			//if(i != "undefined")
			//{
				let string = i;
				string = i[0].toUpperCase();
				string += i.substring(1, i.length);
				final[k++] = {"key": string, "count": data[i]};
			//}
		}
		
		final.sort(function(a, b) {
			return parseInt(b.count) - parseInt(a.count);
		})

		let limiter = 25;
		let num = document.getElementById('number').value;
		if(num)
			limiter = num > final.length ? final.length : num;

		if(final.length > limiter)
		{
			let trimFinal = [];
			for(let i = 0; i < limiter; i++)
			{
				trimFinal[i] = Object.assign({}, final[i]);
			}
			trimFinal[limiter] = {"key": "Others", "count": 0};
			for(let i = limiter; i < final.length; i++)
			{
				trimFinal[limiter].count += final[i].count;
			}
			final = trimFinal;
		}
		let table = new Table()
		table.createTable(final)
		let chart = new PiChart()
		chart.createChart2(final)
	}
}

class Table {
	constructor()
	{
		console.log("execution came here");
		this.table = d3.select("table");
		this.table.attr("style", "visibility: visible");
	}

	createTable(data)
	{
		console.log(data)
		let tr = this.table.select("tbody").selectAll("tr").data(data);
		let newTr = tr.enter().append("tr");
		tr.exit().remove();
		tr = newTr.merge(tr);

		let td = tr.selectAll("td").data(d=>[d.key, d.count]);
		let newTd = td.enter().append("td");
		td.exit().remove();
		td = newTd.merge(td);

		td.text(d=>d);
		//let table = d3.select("table").data(data);

	}
}

class PiChart
{
	constructor()
	{
		this.chart = d3.select("#piechart");
		let width = this.chart.node().getBoundingClientRect().width;
		let height = this.chart.node().getBoundingClientRect().height;
		this.outerRadius = Math.min(width, height) * 0.5 - 40;
		this.radius = Math.min(width, height) / 2 - 20;
		this.chart.append("g").attr("class", "piChart").attr("transform", "translate(" + (width / 2 + 10) + "," + height / 2 + ")");

	}

	createChart(data)
	{
		let _this = this;

		function midAngle(d){
			return d.startAngle + (d.endAngle - d.startAngle)/2;
		}

		let pie = d3.pie()
					.sort(null)
					.value(function(d){return d.count;});
		let path = d3.arc()
					 .outerRadius(_this.radius - _this.radius/4)
					 .innerRadius(_this.radius/4);
		let label = d3.arc()
		 			  .outerRadius(_this.radius - _this.radius/2)
		 			  .innerRadius(_this.radius - _this.radius/2);

		let arc = this.chart.select(".piChart").selectAll(".arc").data(pie(data));
		let newArc = arc.enter().append("g").attr("class", "arc");
		arc.exit().remove();
		arc = newArc.merge(arc);
		
		let slice = arc.selectAll("path").data(function(d){return d3.select(this).data();})
		let newslice = slice.enter().append("path")

		slice.exit().remove()
		slice = newslice.merge(slice);

		slice.attr("d", path).attr("fill", function(d) { return "gray"; });;

		let text = arc.selectAll("text").data(function(d){return d3.select(this).data();});
		let newtxt = text.enter().append("text")

		text.exit().remove()
		text = newtxt.merge(text);

		text.attr("dy", "0.35em").text(function(d){ return d.data.key + " " + d.data.count ;})
			.attr("transform", function (d) {
				let rotation = (midAngle(d) * 180 / Math.PI - 90)
                return "rotate(" + rotation + ") translate(" + _this.outerRadius + ",0)";
            });

	}

	createChart2(data)
	{
		let _this = this;
		let index = 0;
		let radiusLabel = _this.radius - _this.radius / 4;

		//let color = d3.scale.category20(); 
		function colorPicker(d) {
		  var colors = ["#3366cc", "#dc3912", "#ff9900", "#109618", "#990099", "#0099c6", "#dd4477", "#66aa00", "#b82e2e", "#316395", "#994499", "#22aa99", "#aaaa11", "#6633cc", "#e67300", "#8b0707", "#651067", "#329262", "#5574a6", "#3b3eac"];
		  return colors[d % colors.length];
		}

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

		let arc =  	this.chart.select(".piChart").selectAll(".arc").data(pie(data));
		let newArc = arc.enter().append("g");

		arc.exit().remove();
		arc = newArc.merge(arc);
		arc.attr("class", "arc")
			.on("mouseover", function(e) {
				d3.selectAll(".arc").attr("style", "opacity: 0.3;");
				d3.select(this).style("opacity", 1).append("title").text("Page Views: " + e.data.count);
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
						position[0] -= 40
					else
						position[0] +=  40 //path.centroid(d)//midAngle(d)//radiusLabel * (midAngle(d) > Math.PI? -1: 1) - 2;
					position[1] += 2;
					console.log(position);
					return "translate(" + position + ")";
			 });
			

		let polyline = arc.selectAll("polyline").data(function(d){return d3.select(this).data();});
		let newline = polyline.enter().append("polyline");

		polyline.exit().remove();
		polyline = newline.merge(polyline);

		polyline.attr("points", function(d) {
				    let position = label.centroid(d);
				    if(midAngle(d) > Math.PI)
						position[0] -= 40
					else
				   		position[0] += 40// radiusLabel * (midAngle(d)> Math.PI? -1: 1);
				    return [path.centroid(d), label.centroid(d), position];
				});
	};

}
