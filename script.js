
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
			if(data[line[6]])
				data[line[6]]++;
			else
				data[line[6]] = 1;
		}

		for (let i in data){
			if(i != "undefined")
			{
				let string = i;
				string = i[0].toUpperCase();
				string += i.substring(1, i.length);
				final[k++] = {"key": string, "count": data[i]};
			}
		}
		
		final.sort(function(a, b) {
			return parseInt(b.count) - parseInt(a.count);
		})

		let table = new Table()
		table.createTable(final)
		let chart = new PiChart()
		chart.createChart(final)
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
		this.radius = Math.min(width, height) / 2,
		this.chart.append("g").attr("class", "piChart").attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

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
}