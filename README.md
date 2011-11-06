jsGeneticAlgorithm
========

#### Genetic Algorithm in Javascript ####

This is an implementation of a genetic algorithm in Javascript. Genetic algorithms are sometimes called Evolutionary Algorithms and you can read a lot about them <a href="http://en.wikipedia.org/wiki/Genetic_algorithm">on Wikipedia</a>.

### Usage ###

The entire algorithm (and documentation) is contained within the file jsGeneticAlgorithm.js. You can execute the code in various ways: Using your browser's Javascript console, using a Javascript engine, or by embedding it into an HTML site. Most people will probably embed the code in an HTML site. Several example HTML files are included in the repository. The following is a quick tour through the example files covering everything you can do with this class.

## Example 1 ##

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

This is the most basic use case. It's not very useful but it will work. The genetic algorithm will run with default parameters on a default problem. 

The default problem is to find a list of eight numbers whose sum is equal 5.6. The population size equals 100 individuals, fitness proportional selection is used during the recombination stage, a mutation rate of 5% is applied on a per-gene basis, and elitism with an elite size of 50 individuals is exercised. The algorithm terminates after 100 generations.

The returned variable `ga` contains an object exposing a number of functions to query information about the genetic algorithm run. The sample uses `ga.getFittest()` to retrieve the genome of the fittest individual. Other functions currently available are `ga.getMaxFitnessHistory()` and `ga.getAvgFitnessHistory()`.
	
## Example 2 ##

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

This example changes some of the parameters used in the genetic algorithm but is otherwise identical with example 1. We reduce the population size, reduce the elite size and only complete half the number of generations. We also chose `1-point` crossover instead of the default `2-point` crossover. Generally, you would expect worse results than example 1 because overall less individuals are evaluated.

### Development Status ###

This code is currently in development. More documentation is forthcoming over the next few days. 

Last updated November 5, 2011.