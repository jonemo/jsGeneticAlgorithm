jsGeneticAlgorithm
==================

This is an implementation of a genetic algorithm in Javascript. Genetic algorithms are sometimes called Evolutionary Algorithms and you can read a lot about them <a href="http://en.wikipedia.org/wiki/Genetic_algorithm">on Wikipedia</a>.

Usage
-----

The entire algorithm (and documentation) is contained within the file jsGeneticAlgorithm.js. You can execute the code in various ways: Using your browser's Javascript console, using a Javascript engine, or by embedding it into an HTML site. Most people will probably embed the code in an HTML site. Several example HTML files are included in the repository. The following is a quick tour through the example files covering everything you can do with this class.

### Example 1 ###

```html
<html><body>
	<script src="jsGeneticAlgorithm.js"></script>
	<pre><script>
		var ga = GeneticAlgorithm();
		var fittest = ga.getFittest();
		document.write('Fittest genome = {' + fittest.join(', ') + '}');
		document.write('<br>');
		document.write('Sum of fittest genome = ' + (function () { for (var i=0, sum=0; i<fittest.length; i++) {sum+=fittest[i];} return sum; })())
	</script></pre>
</body></html>
```

This is the most basic use case. It's not very useful but it will work. The genetic algorithm will run with default parameters on a default problem. 

The default problem is to find a list of eight numbers whose sum is equal 5.6. The population size equals 100 individuals, fitness proportional selection is used during the recombination stage, a mutation rate of 5% is applied on a per-gene basis, and elitism with an elite size of 50 individuals is exercised. The algorithm terminates after 100 generations.

The returned variable `ga` contains an object exposing a number of functions to query information about the genetic algorithm run. The sample uses `ga.getFittest()` to retrieve the genome of the fittest individual. Other functions currently available are `ga.getMaxFitnessHistory()` and `ga.getAvgFitnessHistory()`.
	
### Example 2 ###

```html
<html><body>
	<script src="jsGeneticAlgorithm.js"></script>
	<pre><script>
		var ga = GeneticAlgorithm({
			popSize: 50,
			mutationRate: 0.10,
			eliteSize: 20,
			crossoverMethod: '1-point',
			maxGenerationCount: 30
		});
		var fittest = ga.getFittest();
		document.write('Fittest genome = {' + fittest.join(', ') + '}');
		document.write('<br>');
		document.write('Sum of fittest genome = ' + (function () { for (var i=0, sum=0; i<fittest.length; i++) {sum+=fittest[i];} return sum; })())
	</script></pre>
</body></html>
```

This example changes some of the parameters used in the genetic algorithm but is otherwise identical with example 1. We reduce the population size, reduce the elite size and only complete half the number of generations. We also chose `1-point` crossover instead of the default `2-point` crossover. Generally, you would expect worse results than example 1 because overall less individuals are evaluated.

### Example 3 ###

Travelling Salesman. To be written.

### Example 4 ###

```html
<html><body>
	<script src="jsGeneticAlgorithm.js"></script>
	<canvas id="fitnessHistoryCanvas" width="1000" height="102"></canvas>  
	<pre><script>
		// This is a helper function used in randomFunction() and mutationFunction() passed to the GeneticAlgorithm.
		// Due to closure, this function will be available inside the Genetic Algorithm for initializing the first 
		// generation andmutations.
		var addChildren = function (parentId, depth, ind) {
			// each node has a maximum of six children nodes
			for (var i=0; i<6; i++) {
				if (Math.random() < Math.pow(0.6, depth)) {
					// create a node with random numerical value
					ind.push({parent:parentId, value:Math.random()*2-1});
					// now add children recursively
					addChildren(ind.length-1, depth+1, ind);
				}
			}
		};
		
		// This function evaluates the sum of the products obtained by multiplying every leaf with all of its
		// ancestor nodes in the tree. The function is used in the fitness function and later when the fittest
		// individual is displayed (after the genetic algorithm has run).
		// Due to closure, this function will be available inside the Genetic Algorithm.
		var evaluateTree = function (ind) {
			// find all leaves
			var leaveNodes = [];
			for (var i=0; i<ind.length; i++) {
				leaveNodes.push(true);
			}
			for (i=ind.length-1; i>=0; i--) {
				leaveNodes[ind[i].parent] = false;
			}
			// evaluate the numerical value encoded in the tree
			var treeSum = 0;
			for (i=0; i<ind.length; i++) {
				if (leaveNodes[i]) {
					var product = ind[i].value, parentPointer = ind[i].parent;
					while (parentPointer !== undefined) {
						product *= ind[parentPointer].value;
						parentPointer = ind[parentPointer].parent;
					}
					treeSum += product;
				}
			}
			
			return treeSum;
		};
		
		// This is where we define the parameters of the genetic algorithm and the problem specific functions. All 
		// available parameters, even if the specified value equals the default value. For an explanation of the 
		// each parameter, see the inline documentation in jsGeneticAlgorithm.js.
		var ga = GeneticAlgorithm({
			popSize: 100,
			randomFunction: function () {
					// create genome with a top node with random numerical value and no parent
					var ind = [{parent:undefined, value: Math.random()*20-10}];
					// recursively add children nodes
					addChildren(0, 1, ind);
					
					return ind; 
				},
			mutationFunction: function (ind) {
					// validate that the individual is valid
					if (! ind || !ind.length || ind.length < 1) return ind;
					// decide which node to mutate
					var k = Math.floor(Math.random()*ind.length);
					// find all decendant nodes of this node and remove them
					for (var j=ind.length-1; j>k; j--) {
						var isSubNode = false, parentPointer = ind[j].parent;
						while (parentPointer >= k) {
							if (parentPointer == k) {
								isSubNode = true;
								break;
							}
							parentPointer = ind[parentPointer].parent;
						}
						if (isSubNode) {
							ind.slice(j, j+1);
						}
					}
					// give the mutated node an arbitrary new numerical value
					ind[k].value = Math.random()*2-1;
					// find at what depth node k is
					var depth = 0;
					parentPointer = ind[k].parent;
					while (parentPointer != undefined) {
						depth++;
						parentPointer = ind[parentPointer].parent;
					}
					// add a new random subtree to node k
					addChildren(k, depth, ind);

					return ind; 
				},
			mutationRate: 0.10,
			selectionMethod: 'rank-prop',
			tournamentSize: undefined,
			eliteSize: 50,
			crossoverMethod: '1-point',
			fitnessFunction: function (ind) {
					// find the difference to pi/10 and return the inverse of its absolute value as fitness
					return 1/Math.abs(Math.PI/10 - evaluateTree(ind));
				},
			stopCondition: 'generation-count',
			maxGenerationCount: 1000,
			maxStaticGenerations: undefined,
			debug: 0
		});
		
		// When code execution arrives here, the genetic algorithm has run and found a solution.
		
		// It is now possible to retrieve statistics about the evolution run. Let's use the canvas to 
		// display a time history of maximum and average fitness.
		var maxFitnessHistory = ga.getMaxFitnessHistory();
		var avgFitnessHistory = ga.getAvgFitnessHistory();
		var maxFitnessEver = maxFitnessHistory[maxFitnessHistory.length-1];
		var canvas = document.getElementById('fitnessHistoryCanvas');
		var ctx = canvas.getContext("2d"); 
		for (var i=0; i<maxFitnessHistory.length; i=i+1) {
			ctx.fillStyle = "rgb(0,0,200)"; 
			ctx.fillRect (i/1, 100-Math.ceil(avgFitnessHistory[i]/maxFitnessEver*97), 1, 2);
			ctx.fillStyle = "rgb(200,0,0)"; 
			ctx.fillRect (i/1, 100-Math.ceil(maxFitnessHistory[i]/maxFitnessEver*97), 1, 2);
		}
		
		// It is also possible to query for the fittest individual discovered
		var fittest = ga.getFittest();
		document.write('Fittest genome evaluates to ' + evaluateTree(fittest) + ' resulting in a fitness of ' + maxFitnessHistory[maxFitnessHistory.length-1] + '<br>');
		
		// display the tree described by the genome of the fittest individual
		var depths = [0];
		for (var i=0; i<fittest.length; i++) {
			document.write('[' + i + '] ' + fittest[i].value + ', parent: ' + fittest[i].parent + '<br>');
		}
	</script></pre>
</body></html>
```

This example illustrates how to use genomes that are not simply an array of numbers. With a suitable set of initialization, muatation, and fitness evaluation functions, each individual's genome may consist of an array of arbitrary datatype(s).

Here we use a tree structure with every node representing one floating point number between -1 and 1, one example tree is shown here:

![Visual representation of a genome as a tree of connected numbers.](https://raw.github.com/jonemo/jsGeneticAlgorithm/master/docs/graph_individual.png "Visual representation of a genome as a tree of connected numbers.")

The fitness of an individual is evaluated by multiplying every tree leaf with all of its parent nodes, summing up the result and comparing the result to &pi;/10. The fitness is the inverse of the difference squared. For the tree above the fitness would be: ``` 1 / [ (4.15)(-5.32)(0.30)+(8.66)(-1.92)(-5.32)(0.30)+(3.76)(4.01)(8.02)(0.30)+(1.59)(8.02)(0.30)+(-2.93)(8.02)(0.30)+(1.78)(-0.95)(-0.37)(-3.47)(0.30)+(5.45)(-0.37)(-3.47)(0.30)+(5.07)(-3.47)(0.30)+(-2.88)(0.04)(4.34)(0.03) - &pi;/10] ^ 2 = 0.00047``` Note that the general idea is to have a fitness metric, that is always bigger than zero and always has a gradient towards a maximum. If a large group of individuals has the same fitness, a genetic algorithm might not be a good way for finding a maximum in the fitness landscape.

This fitness metric used in this example is arbitrary and as far as I can tell it's pretty non-sensical. Remember, the purpose of this example is simply to show that an array of any datatype can be used for the genome. It is also not necessary, that all genomes have the same length!

To encode such a tree in a genome, every node becomes an entry in the array and stores its numeric value and references its parent node. The function that creates such trees randomly is shown in this snippet:

```javascript
randomFunction: function () {
		// create genome with a top node with random numerical value and no parent
		var ind = [{parent:undefined, value: Math.random()*20-10}];
		// recursively add children nodes
		addChildren(0, 1, ind);
		
		return ind; 
	},
```

It creates a first node (every tree has at least one node) and then uses ```addChildren()``` to recursively add child nodes. The probabilty of child nodes reduces with the depth of tree, to avoid infinite or very long trees.

The mutation function looks more complex but is actually conceptually very similar:

```javascript
mutationFunction: function (ind) {
		// validate that the individual is valid
		if (! ind || !ind.length || ind.length < 1) return ind;
		// decide which node to mutate
		var k = Math.floor(Math.random()*ind.length);
		// find all decendant nodes of this node and remove them
		for (var j=ind.length-1; j>k; j--) {
			var isSubNode = false, parentPointer = ind[j].parent;
			while (parentPointer >= k) {
				if (parentPointer == k) {
					isSubNode = true;
					break;
				}
				parentPointer = ind[parentPointer].parent;
			}
			if (isSubNode) {
				ind.slice(j, j+1);
			}
		}
		// give the mutated node an arbitrary new numerical value
		ind[k].value = Math.random()*2-1;
		// find at what depth node k is
		var depth = 0;
		parentPointer = ind[k].parent;
		while (parentPointer != undefined) {
			depth++;
			parentPointer = ind[parentPointer].parent;
		}
		// add a new random subtree to node k
		addChildren(k, depth, ind);

		return ind; 
	},
```

It randomly picks one node in the tree and removes it from the tree together with the subtree attached to it. Again using the ```addChildren()``` function, a random subtree is created in its place. Remember that the ```mutationRate``` parameter defines how likely it is, that any individual experiences a single mutation.

In this example we use rank-proportional selection, a population size of 100 individuals, half of which transfer directly to the next generation as members of the "elite".

Development Status
---------------------

This code is currently in development. More documentation is forthcoming. Additional functionality will be added as I need them for my own purposes or on request.