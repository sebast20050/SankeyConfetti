//Initial configuration of the Viz, Size
var width = 1100, height = 500;

//It asumes that in your HTML you have a <canvas> and an <svg> elements
d3.select("canvas").attr("width", width).attr("height", height);
var svg = d3.select("svg").attr("width", width).attr("height", height).append("g");

// I choose to avoid any selection of the path in the sankey graph, because It doesn't add any major info.
// the info is allocated on the particles that are flowing over the paths.
d3.select("head").append("style").html(`
  .node rect { cursor: move; fill-opacity: .9; shape-rendering: crispEdges; }
  .node text { pointer-events: none; font: 12px sans-serif; }
  .link { fill: none; stroke: #000; stroke-opacity: .05; pointer-events: none; }
  .link:hover { stroke-opacity: .25; }
  svg, canvas { position: absolute; }
  .particle-tooltip {
    position: absolute; pointer-events: none; padding: 6px 8px; background: rgba(0,0,0,0.8);
    color: #fff; font: 12px sans-serif; border-radius: 6px; line-height: 1.2; display: none; z-index: 10;
    max-width: 260px; white-space: pre-wrap;
  }
`);

//Here I define the tooltip for the particles (over the canvas)
var tooltip = d3.select("body").append("div").attr("class", "particle-tooltip");

// Sankey Viz based on D3. 
//Nodewidth is the with of the rectangles that represent the nodes
//nodePadding is the distance between the nodes
//size is the size of the whole sankey diagram
var sankey = d3.sankey().nodeWidth(15).nodePadding(10).size([width, height]);
var path = sankey.link();

var particles = [];          //Each particle represents a row in data.csv (with startAt chained by ID)
var hoveredParticle = null;  //Currently "hovered" particle to highlight and tooltip

//Data Loading
d3.csv("data.csv", function(flowDataRaw) {
  d3.csv("node_colors.csv", function(nodeColors) {
    d3.csv("type_colors.csv", function(typeColors) {
      //some Data massaging
      //Just because in many cases, users can write the headers with different capitalizations. 
      //or even if the duration is null, or description is missing.
      var flowData = flowDataRaw.map(function(d) {
        return {
          id:            d.ID || d.Id || d.id,
          sourceName:    d.Source || d.source,
          targetName:    d.Target || d.target,
          type:          d.Type || d.type,
          duration:     + (d.Duration || d.duration) || 1000,
          description:   d.Description || d.description || ""
        };
      });
      //Colour Maps
      var nodeColorMap = {}, typeColorMap = {};
      nodeColors.forEach(function(d){ nodeColorMap[d.Node] = d.Color; });
      typeColors.forEach(function(d){ typeColorMap[d.Type] = d.Color; });
      //Node Definition and Names
      var nodeNames = Array.from(new Set(flowData.flatMap(function(d){ return [d.sourceName, d.targetName]; })));
      var nodes = nodeNames.map(function(name){ return { name: name }; });
      //Links Definition
      //This is something to improve because I need to have a link for each different path, not for each row. 
      var links = flowData.map(function(d){
        return {
          source: nodeNames.indexOf(d.sourceName),
          target: nodeNames.indexOf(d.targetName),
          type: d.type,
          value: 1,
          duration: d.duration,
          id: d.id,
          description: d.description
        };
      });
      // Layout sankey
      sankey.nodes(nodes).links(links).layout(32);

      // DrawLinks
      var link = svg.append("g").selectAll(".link")
        .data(links).enter().append("path")
        .attr("class", "link")
        .attr("d", path)
        .style("stroke-width", function(d){ return Math.max(1, d.dy); })
        .sort(function(a,b){ return b.dy - a.dy; });

      //Store the reference to the path element for each link (for particles to follow)
      link.each(function(d){ d.pathElement = this; });

      // DrawNodes
      var node = svg.append("g").selectAll(".node")
        .data(nodes).enter().append("g")
        .attr("class", "node")
        .attr("transform", function(d){ return "translate(" + d.x + "," + d.y + ")"; })
        .call(d3.behavior.drag()
          .origin(function(d){ return d; })
          .on("drag", function(d) {
            d.y = Math.max(0, Math.min(height - d.dy, d3.event.y));
            d3.select(this).attr("transform", "translate(" + d.x + "," + d.y + ")");
            sankey.relayout();
            link.attr("d", path);
          })
        );

      node.append("rect")
        .attr("height", function(d){ return d.dy; })
        .attr("width", sankey.nodeWidth())
        .style("fill", function(d){ return nodeColorMap[d.name] || "#999"; });

      node.append("text")
        .attr("y", function(d){ return d.dy / 2; })
        .attr("dy", ".35em")
        .text(function(d){ return d.name; })
        .attr("x", function(d) {
          var hasOutgoing = links.some(function(l){ return l.source === d; });
          return hasOutgoing ? -6 : 6 + sankey.nodeWidth();
        })
        .attr("text-anchor", function(d) {
          var hasOutgoing = links.some(function(l){ return l.source === d; });
          return hasOutgoing ? "end" : "start";
        })
        .style("font-family", "Montserrat, sans-serif")
        .style("font-weight", "900");

      // The Sprinkler for the Sankey. 
      var particleSize = d3.scale.linear()
        .domain(d3.extent(links, function(d){ return d.value; }))
        .range([2, 5]);

      links.forEach(function(l) {
        l.particleSize = particleSize(l.value);
        l.particleColor = function(){ return typeColorMap[l.type] || "#000"; };
      });

      // Grouping Links
      var groupedById = d3.nest().key(function(d){ return d.id; }).entries(links);

      groupedById.forEach(function(g) {
        // Assure consistent order of the particles along the same path
        g.values.sort(function(a,b){
          if (a.source.x !== b.source.x) return a.source.x - b.source.x;
          return (a.source.y || 0) - (b.source.y || 0);
        });

        var acc = 0;
        var offset = null;

        g.values.forEach(function(l, i) {
          l.startAt = acc;
          acc += l.duration;

          // Unique offset taken by all the group in order to kept Y offset and the particle starts from it ends. 
          if (i === 0) {
            var defaultY0 = l.source.y + (l.sy || 0) + (l.dy / 2);
            var randomYstart = l.source.y + Math.random() * (l.source.dy || l.source.dy === 0 ? l.source.dy : 10);
            offset = randomYstart - defaultY0;
          }

          particles.push({
            link: l,
            path: l.pathElement,
            startAt: l.startAt,
            offset: offset,
            size: l.particleSize,
            color: l.particleColor(),
            description: l.description,
            id: l.id,
            _x: null, _y: null
          });
        });
      });

      // Time
      var timer = d3.timer(tick, 0);

      // Interaction
      var canvas = d3.select("canvas");

      // Handler for the mouse movement
      function handleMouse() {
        var rect = canvas.node().getBoundingClientRect();
        var e = d3.event;
        if (!e) return;

        // Coordinates Relatives to canvas
        var mx = (e.clientX || 0) - rect.left;
        var my = (e.clientY || 0) - rect.top;

        // Out of bounds
        if (mx < 0 || my < 0 || mx > rect.width || my > rect.height) {
          hoveredParticle = null;
          tooltip.style("display", "none");
          return;
        }

        // Look the nearest particle
        var nearest = null;
        var minD2 = Infinity;

        for (var i = 0; i < particles.length; i++) {
          var p = particles[i];
          if (p._x == null) continue;
          var dx = p._x - mx, dy = p._y - my;
          var d2 = dx*dx + dy*dy;
          var localThresh = Math.max(6, p.size + 3);
          var localThresh2 = localThresh * localThresh;
          if (d2 < localThresh2 && d2 < minD2) {
            minD2 = d2;
            nearest = p;
          }
        }

        hoveredParticle = nearest;

        if (hoveredParticle) {
          tooltip.style("display", "block")
                 .style("left", (e.pageX + 12) + "px")
                 .style("top",  (e.pageY + 12) + "px")
                 .text("ID: " + hoveredParticle.id + "\nDescription: " + (hoveredParticle.description || ""));
        } else {
          tooltip.style("display", "none");
        }
      }

      // Escuchar both: canvas (por compatibilidad) y window (cuando el SVG esté por encima)
      canvas.on("mousemove", handleMouse);
      d3.select(window).on("mousemove", handleMouse);

      // Hide to tooltip when leaving the canvas or window
      canvas.on("mouseout", function() {
        hoveredParticle = null;
        tooltip.style("display", "none");
      });
      d3.select(window).on("mouseout", function() {
        hoveredParticle = null;
        tooltip.style("display", "none");
      });

      // Drawing Loop
      function tick(elapsed) {
        var context = d3.select("canvas").node().getContext("2d");
        context.clearRect(0, 0, width, height);

        particles = particles.filter(function(p){
          if (elapsed < p.startAt) {
            p._x = p._y = null; // not visible yet
            return true;
          }

          var currentTime = elapsed - p.startAt;
          var progress = Math.min(currentTime / p.link.duration, 1); // lineal

          if (progress >= 1) {
            // it arrived to the destiny
            return false;
          }

          var pathLength = p.path.getTotalLength();
          var pos = p.path.getPointAtLength(progress * pathLength);
          var x = pos.x;
          var y = pos.y + (p.offset || 0);

          // Save position to hoover
          p._x = x; p._y = y;

          // Draw particle
          context.beginPath();
          context.fillStyle = p.color;
          //Here is a possible fix, to add a new type, in which the particle form can be an square, but I think it add complexity
          context.arc(x, y, p.size, 0, 2 * Math.PI);
          context.fill();

          // If isn't has a hover, just draw normally
          if (hoveredParticle === p) {
            context.beginPath();
            context.lineWidth = 2;
            context.strokeStyle = "rgba(0,0,0,0.9)";
            context.arc(x, y, p.size + 3, 0, 2*Math.PI);
            context.stroke();
          }

          return true;
        });

        // When it finishes, clean the viz.
        if (particles.length === 0) {
          timer.stop();
          context.clearRect(0, 0, width, height);
          tooltip.style("display", "none");
        }
      }

    });
  });
});
