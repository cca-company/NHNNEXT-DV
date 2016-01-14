var Data = {
	mapData : null,
	crimeData : null,
	init : function(){
		d3.json("korea.json", function(json) {
			this.mapData = json;
			d3.json("crime.json", function(json){
				this.crimeData = json;
				Map.draw();
				Graph.draw("total");
			}.bind(this));
		}.bind(this));
	},
	totalRegionCrimeData : function(region){
		var total = 0;
		for(var i = 0; i < this.crimeData.length; ++i){
			var crime = this.crimeData[i];
			total += crime.data[0][region];
		}
		return total
	},
	regionCrimeData : function(region){
		var crimes = [];
		for(var i = 0; i < this.crimeData.length; ++i){
			var crime = this.crimeData[i];
			crimes.push(crime.data[0][region]);
		}
		return crimes;
	},
	crimes : function(){
		var crimes = [];
		for(var i = 0; i < this.crimeData.length; ++i){
			var crime = this.crimeData[i];
			crimes.push(crime.name);
		}
		return crimes;
	}
}