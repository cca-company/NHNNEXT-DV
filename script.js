var Map = {
    width : $(window).width(),
    height : $(window).height(),
    initialScale : 5500,
    initialX : -11900,
    initialY : 4050,
    centered : null,
    svg : null,
    states : null,
    projection : null,
    path : null,
    labels : null,
    init : function() {
        this.projection = d3.geo.mercator()
            .scale(this.initialScale)
            .translate([this.initialX, this.initialY]);

        this.path = d3.geo.path()
            .projection(this.projection);

        this.zoom = d3.behavior.zoom()
            .translate(this.projection.translate());

        this.svg = d3.select("#map-container").append("svg")
            .attr("width", this.width)
            .attr("height", this.height)
            .attr('id', 'map');

        this.states = this.svg.append("g")
            .attr("id", "states")
            .call(this.zoom.bind(this));
    },
    draw : function(){

        var data = Data.mapData;

        this.states.selectAll("path")
            .data(data.features)
            .enter()
            .append("path")
            .attr("data-region",function(d){return d.properties.name})
            .attr("d", this.path)
            .attr("id", function(d) { return 'path-'+d.id; })
            .attr("fill", this.crimeColor.bind(this))
            .on("click", this.click.bind(this));

        this.labels = this.states.selectAll("text")
            .data(data.features)
            .enter()
            .append("text")
            .attr("transform", this.labelsTransform.bind(this))
            .attr("id", function(d) { return 'label-'+d.id; })
            .attr('text-anchor', 'middle')
            .attr("dy", ".35em")
            .on("click", this.click.bind(this))
            .text(function(d) { return d.properties.Name; });

    },
    zoom : function(){
        this.projection.translate(d3.event.translate)
            .scale(d3.event.scale);

        this.states.selectAll("path")
            .attr("d", path);

        this.labels.attr("transform", this.labelsTransform.bind(this));
    },
    labelsTransform : function(d) {
        // 경기도가 서울특별시와 겹쳐서 예외 처리
        if (d.id == 8) {
            var arr = this.path.centroid(d);
            arr[1] += (d3.event && d3.event.scale) ? (d3.event.scale / height + 20) : (this.initialScale / this.height + 20);

            return "translate(" + arr + ")";
        } else {
            return "translate(" + this.path.centroid(d) + ")";
        }
    },
    click : function(d){

        var x, y, k;

        if (d && this.centered !== d) {
            var centroid = this.path.centroid(d);
            x = centroid[0] + 100;
            y = centroid[1];
            k = 2;
            this.centered = d;

            Graph.draw(d.properties.Name);

        } else {
            x = this.width / 2;
            y = this.height / 2;
            k = 1;
            this.centered = null;

            Graph.draw("total");

        }

        this.states.selectAll("path")
            .classed("inactive", this.centered && function(d) { return d != this.centered;}.bind(this));

        this.states.transition()
            .duration(500)
            .attr("transform", "translate(" + this.width / 2 + "," + this.height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
            .style("stroke-width", 1.5 / k + "px");
    },
    crimeColor : function(d){
        var colorList = ["#ff0000","#DD5500","#AAAA00","#55DD00","#00FF00"];
        var totalCrime = Data.totalRegionCrimeData(d.properties.Name);
        var index = 4;
        if(totalCrime >= 100000){
            index = 0;
        }else if(totalCrime >= 75000){
            index = 1;
        }else if(totalCrime >= 50000){
            index = 2;
        }else if(totalCrime >= 25000){
            index = 3;
        }
        return colorList[index];
    }

}

var Graph = {
    width : "100%",
    height : $(window).height(),
    innerRadius : 100,
    outerRadius : 150,
    pie : d3.layout.pie(),
    color : d3.scale.category10(),
    arc : null,
    svg : null,
    arcs : null,
    init : function(){
        this.arc = d3.svg.arc()
            .innerRadius(this.innerRadius)
            .outerRadius(this.outerRadius);

        this.svg = d3.select("#datainfo-container").append("svg")
            .attr("width", this.width)
            .attr("height", this.height)
            .attr('id', 'datainfo');
    },
    draw : function(region){
        var crimeData = Data.regionCrimeData(region);
        var crimeNames = Data.crimes();
        var crimeTotal = Data.totalRegionCrimeData(region);

        // svg 초기화
        this.svg.selectAll("g").remove();

        // 그래프 추가
        var arcs = this.svg.selectAll("g.arc")
            .data(this.pie(crimeData))
            .enter()
            .append("g")
            .attr("class","arc")
            .attr("transform","translate(300,200)");

        arcs.append("path")
            .attr("fill",function(d,i){
                return this.color(i);
            }.bind(this))
            .attr("d",this.arc)
            .on("mouseover",function(d,i){$(".crime-text").css("display","none"); $("#crime-"+i).css("display","block");})
            .on("mouseout",function(d,i){$(".crime-text").css("display","none"); $("#crime-total").css("display","block");});

        // 범죄별 레이블
        var crimeText = arcs.append("g")
            .attr("class","crime-text")
            .attr("id", function(d,i){return "crime-"+i;})
            .attr("style", "display:none;");

        crimeText.append("text")
            .attr("transform",function(d){
                return "translate(0,"+-5+")";
            })
            .attr("text-anchor","middle")
            .text(function(d,i){
                return crimeNames[i];
            });

        crimeText.append("text")
            .attr("transform",function(d){
                return "translate(0,"+15+")";
            })
            .attr("text-anchor","middle")
            .text(function(d,i){
                return d.data + "건";
            });

        // 전체 범죄 발생수 레이블
        var totalText = this.svg.append("g")
            .attr("class","crime-text")
            .attr("id", "crime-total")
            .attr("transform","translate(300,200)");

        totalText.append("text")
            .attr("transform",function(d){
                return "translate(0,"+-5+")";
            })
            .attr("text-anchor","middle")
            .text(region);

        totalText.append("text")
            .attr("transform",function(d){
                return "translate(0,"+15+")";
            })
            .attr("text-anchor","middle")
            .text("전체 " + crimeTotal + "건");
    }
}

Data.init();
Map.init();
Graph.init();