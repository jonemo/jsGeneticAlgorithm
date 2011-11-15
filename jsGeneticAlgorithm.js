/**
 * @author Jonas Neubert mailto:jn@jonasneubert.de http://www.jonasneubert.com
 *
 * Runs a genetic algorithm. 
 *
 * By default the genetic algorithm will operate on a population of 100 individuals, 
 * encoded as an eight element array. The default fitness function favors individuals
 * whose sum is equal to 5.6.
 *
 * Through supplying functions and parameters, the problem statement and the genetic
 * algorithm can be changed.
 *
 *
 * @constructor
 * @param {int}				spec.popSize				Population size.
 * @param {function}		spec.randomFunction			Function used to initialize a random individual.
 * @param {function}		spec.mutationFunction		Mutates an individual
 * @param {float}			spec.mutationRate			Mutation rate. Between 0 and 1.
 * @param {string}			spec.selectionMethod		What type of selection? [fitness-prop, rank-proportional, tournament]
 * @param {int}				spec.tournamentSize			Parameter used for tournament selection, defines the number of individuals in each tournamen. Larger tournament sizes increase the selection pressure. Default is 10% of the population Size.
 * @param {int}				spec.eliteSize				Parameter used for all selection methods. Defines the number of individuals who get transferred to a new population directly. Set parameter to 0 to switch of elitism. Default is half of the population Size.
 * @param {string}			spec.crossoverMethod		Which type of crossover to use [1-point, 2-point]
 * @param {function}		spec.fitnessFunction		Define the fitness function.
 * @param {string}			spec.stopCondition			When does evaluation stop? [generation-count, fitness-static]
 * @param {int}				spec.maxGenerationCount		Used if spec.stopCondition is 'generation-count'
 * @param {int}				spec.maxStaticGenerations	Used if spec.stopCondition is 'fitness-static'
 * @param {int}				spec.debug					If debug = 1, debug messages are output using console.log().
 *	
 * @return {GeneticAlgorithm} Genetic Algorithm Object
 */		
var GeneticAlgorithm = function (spec) {
	"use strict";
	spec = spec || {};

	/**
	* Population size.
	* @private
	*/
	var popSize = spec.popSize || 100;
	/**
	* Tournament size, used by tournament selection.
	* @private
	*/
	var tournamentSize = spec.tournamentSize || Math.ceil(popSize/10);
	/**
	* Number of individuals that move to the next generation without recombination.
	* @private
	*/
	var eliteSize = spec.eliteSize || Math.ceil(popSize/2);
	/**
	* How many generations may the max fitness be static before termination? Used by some stopping conditions.
	* @private
	*/
	var maxStaticGenerations = spec.maxStaticGenerations || 0;
	/**
	* Maximum number of generations (ever!). Used by the default stopping condition.
	* @private
	*/
	var maxGenerationCount = spec.maxGenerationCount || 100;
	/**
	* Mutation rate.
	* @private
	*/
	var mutationRate = (spec.mutationRate && spec.mutationRate < 1) ? spec.mutationRate : 0.05;

	// storage arrays
	
	/** 
	* Stores the individuals of the latest generation.
	* @private 
	*/
	var population = [];
	/** 
	* Stores the individuals from the previous generation, used only temporarily.
	* @private 
	*/
	var prevPopulation = [];
	/** 
	* Fitness of individuals in the latest generation.
	* @private 
	*/
	var fitnesses = [];
	/** 
	* Fitness of individuals in the previous generation.
	* @private 
	*/
	var prevFitnesses = [];
	/** 
	* Generation counter.
	* @private 
	*/
	var generation = 0;
	/** 
	* Time history of the maximal fitness encountered in every generation.
	* @private 
	*/
	var maxFitnessHistory = [];
	/** 
	* Time history of the mean fitness encountered in every generation.
	* @private 
	*/
	var avgFitnessHistory = [];
	/** 
	* Time history of the standard deviation of fitness encountered in every generation.
	* @private 
	*/
	var stdevFitnessHistory = [];	
	/** 
	* The ranks of all individuals [0..popSize], only gets populated when required. entry 0 in ranks is the worst individual.
	* @private 
	*/
	var ranks = [];
	/** 
	* Stores the maxFitness of the current generation.
	* @private 
	*/
	var maxFitness = -Infinity;
	/** 
	* Stores a temporary sum used to calculate the standard deviation of a generation of the current generation.
	* @private 
	*/
	var stdevSum;	
	/** 
	* Stores the mean of fitnesses of the current generation.
	* @private 
	*/
	var mean;	
	/** 
	* Stores the max Fitness of the previous generation.
	* @private 
	*/
	var prevMaxFitness;
	/** 
	* The sum of all fitnesses, used by some selection algorithms.
	* @private 
	*/
	var sumFitness;
	/** 
	* Counts for how many generations the max fitness hasnt increased.
	* @private 
	*/
	var staticFitnessGenCount = 0;
	
	/**
	* Creates a random individual (for the initial population). This can either be supplied as 
	* spec.randomFunction, or a default is chosen that produces individuals consisting of eight floats.
	* @function
	*/
	var randomFunction = spec.randomFunction || function () {
		var ind = [];
		for (var i=0; i<8; i++) {
			ind.push( Math.random()*2-1 );
		}
		return ind;
	};

	/**
	* Mutates an individual. Note that the individual will be mutated always when passed to this function.
	* The mutation rate is taken care of somewhere else. Can either be supplied as spec.mutationFunction
	* or a default will change a random entry in the individuals chromosome assuming it is a number.
	* @function
	*/	
	var mutationFunction = spec.mutationFunction || function (ind) {
		var l = ind.length || 0;
		var k = Math.floor(Math.random()*l);
		ind[k] = Math.random()*2-1;
		return ind;
	};

	/**
	* Mutates an individual. Note that the individual will be mutated always when passed to this function.
	* The mutation rate is taken care of somewhere else. Can either be supplied as spec.mutationFunction
	* or a default will change a random entry in the individuals chromosome assuming it is a number.
	* @function
	*/		
	var mutation = function () {
		for (var i=eliteSize; i<popSize; i++) {
			if (Math.random() < mutationRate) {
				population[i] = mutationFunction(population[i]);
			}
		}
	};
	
	// BREEDING AND SELECTION

	/**
	* Selects one individual using fitness proportional selection.
	*/
	var selectionFitnessProportional = function () {
		var r = getSumOfPrevFitnesses() * Math.random();
		var sum = 0;
			
		for (var j=0; j<popSize; j++) {
			sum += prevFitnesses[j];
			if (r<sum) {
				return j;
			}
		}
	};
	
	/**
	* Generates a new generation from a previous generation using fitness proportional selection.
	* http://en.wikipedia.org/wiki/Fitness_proportionate_selection
	*/
	var breedingFitnessProportional = function () {
		for (var i=eliteSize; i<popSize; i=i+2) {
			var indA = selectionFitnessProportional(), indB = selectionFitnessProportional();
			while (indB === indA) {
				indB = selectionFitnessProportional();
			}
			crossover(indA, indB, i, i+1);
		}	
	};

	/**
	* Selects one individual using fitness proportional selection.
	*/
	var selectionRankProportional = function () {
		var r =  (Math.floor(popSize/2)*(popSize+1)+(popSize%2)*Math.ceil(popSize/2))* Math.random(),
			sum = 0;
			
		for (var j=1; j<=popSize; j++) {
			sum += j;
			if (r<sum) {
				return ranks[j-1];
			}
		}
	};
	
	/**
	* Generates a new generation from a previous generation using rank proportional selection.
	*/
	var breedingRankProportional = function () {
		for (var i=eliteSize; i<popSize; i=i+2) {
			var indA = selectionRankProportional(), indB = selectionRankProportional();
			while (indB !== indA) {
				indB = selectionRankProportional();
			}
			crossover(indA, indB, i, i+1);
		}		
	};

	
	/**
	* Selects one individual using tournament selection.
	* Uses variable tournamentSize from closure.
	*/	
	var selectionTournament = function () {
		var bestIndex, bestFitness = -Infinity, ts=tournamentSize;
		for (var j=0; j<ts; j++) {
			var index = Math.floor(Math.random()*popSize);
			if (prevFitnesses[index] > bestFitness) {
				bestFitness = prevFitnesses[index];
				bestIndex = index;
			}
		}
	
		return bestIndex;
	};
	
	
	/**
	* Generates a new generation from a previous generation using tournament selection.
	* This method requires a tournament size to be set in spec.selectionParams.tournamentSize.
	*
	* http://en.wikipedia.org/wiki/Tournament_selection
	*/	
	var breedingTournament = function () {
		// populate the rank array
		rankPopulation();
		
		for (var i=eliteSize; i<popSize; i=i+2) {
			var indA = selectionTournament(), indB = selectionTournament();
			while (indB !== indA) {
				indB = selectionTournament();
			}		
			crossover(indA, indB, i, i+1);
		}
	};
	
	/**
	* Takes care of transferring the best X individuals over from the previous generation to the current generation. This function is always called before any other breeding function is called.
	*/
	var breedingElitism = function () {
		var es = eliteSize; // no safety net here, because we set this var earlier and user supplied functions cannot overwrite it
		
		for (var i=0; i<es; i++) {
			fitnesses.push(prevFitnesses[i]);
			population.push(prevPopulation[i]);
		}
	};
	
	//fitness-prop is default
	var breeding = breedingFitnessProportional;
	if (spec.selectionMethod === 'tournament') {
		breeding = breedingTournament;
	} 
	else if (spec.selectionMethod === 'rank-proportional') {
		breeding = breedingRankProportional;
	}
	
	// RECOMBINATION
	
	/**
	* Creates two new individuals in indices i, j of the current population by crossing over individuals a, b of the previous population.
	* @param {int} a	Index of first parent.
	* @param {int} b	Index of second parent.
	* @param {int} s	Index of first child.
	* @param {int} t	Index of second child.
	*/
	var onePointCrossover = function (a, b, s, t) {
		var newA = [], 
			newB = [],
			oldA = prevPopulation[a],
			oldB = prevPopulation[b];
			
		var length1 = oldA.length,
			length2 = oldB.length,
			shortestLength = length1,
			longestLength = length2;
		
		if (length1 > length2) {
			shortestLength = length2;
			longestLength = length1;
		}
		
		var crossoverpoint = Math.floor(Math.random() * shortestLength);
		
		for (var i=0; i<crossoverpoint; i++) {
			newA[i] = oldA[i];
			newB[i] = oldB[i];
		}
		for (i=crossoverpoint; i<length1; i++) {
			newB[i] = oldA[i];
		}
		for (i=crossoverpoint; i<length2; i++) {
			newA[i] = oldB[i];
		}
		
		population[s] = newA;
		population[t] = newB;
	};

	/**
	* Creates two new individuals in indices i, j of the current population by crossing over individuals a, b of the previous population.
	* @param {int} a	Index of first parent.
	* @param {int} b	Index of second parent.
	* @param {int} s	Index of first child.
	* @param {int} t	Index of second child.	
	*/	
	var twoPointCrossover = function (a, b, s, t) {
		var newA = [], 
			newB = [],
			oldA = prevPopulation[a],
			oldB = prevPopulation[b];
			
		var length1 = oldA.length,
			length2 = oldB.length,
			shortestLength = length1,
			longestLength = length2;
		
		if (length1 > length2) {
			shortestLength = length2;
			longestLength = length1;
		}
		
		var crossoverpoint1 = Math.floor(Math.random() * shortestLength),
			crossoverpoint2 = Math.floor(Math.random() * shortestLength);
		
		if (shortestLength > 1) {
			while (crossoverpoint1 === crossoverpoint2) {
				crossoverpoint2 = Math.floor(Math.random() * shortestLength);
			}
		}
		
		if (crossoverpoint1 > crossoverpoint2) {
			var tmp = crossoverpoint1;
			crossoverpoint1 = crossoverpoint2;
			crossoverpoint2 = tmp;
		}
		
		for (var i=0; i<crossoverpoint1; i++) {
			newA[i] = oldA[i];
			newB[i] = oldB[i];
		}
		for (i=crossoverpoint1; i<crossoverpoint2; i++) {
			newA[i] = oldB[i];
			newB[i] = oldA[i];
		}
		for (i=crossoverpoint2; i<length1; i++) {
			newA[i] = oldA[i];
		}
		for (i=crossoverpoint2; i<length2; i++) {
			newB[i] = oldB[i];
		}
		
		population[s] = newA;
		population[t] = newB;
	};
	
	/**
	* Is set to whatever crossover method is chosen in spec.crossoverMethod. Default is '2-point'.
	* @function
	*/
	var crossover = twoPointCrossover;
	if (spec.crossoverMethod === '1-point') {
		crossover = onePointCrossover;
	}
	
	// FITNESS EVALUATION
	
	/**
	* Points to the fitness function and must be supplied in spec.fitnessFunction. The default is 
	* a function that evaluates the sum of the entries and returns the square of the difference
	* to 5.6.
	* @function
	*/
	var evaluateFitness = spec.fitnessFunction || function (ind) {
		var sum = 0;
		for (var i=0; i<8; i++) {
			sum += ind[i];
		}
		return 1/Math.abs(sum-5.6); // one over square error
	};
	
	// stop condition
	
	/**
	* Checks if the max generation count stop condition is reached.
	*/
	var stopConditionGenerationCount = function () {
		if (generation < maxGenerationCount) {
			return false;
		}
		return true;
	};
	
	/**
	* Checks if the stationary fitness stop condition is reached.
	*/
	var stopConditionFitnessStatic = function () {
		if (staticFitnessGenCount > maxStaticGenerations) {
			return true;
		}
		return false;	
	};
	
	/**
	* Points to the function that evaluates the chosen stopping condition. Can be specified in spec.stopCondition.
	* 'generation-count' is default.
	* @function
	*/
	var stop = stopConditionGenerationCount;
	if (spec.stopCondition === 'fitness-static') {
		stop = stopConditionFitnessStatic;
	}
	
	
	// helper functions
	
	/**
	* Helper function: Returns the sum of fitnesses of the individuals stored in prevPopulation.
	*/
	var getSumOfPrevFitnesses = function () {
		var sum = 0, ps = popSize;
			
		for (var i=0; i<ps; i++) {
			sum += prevFitnesses[i];
		}
		
		return sum;
	};	
	
	/**
	* Ranks the current generation by storing the rank as integer in an array with the same indices as the population and fitness arrays.
	*/
	var rankPopulation = function () {
		var sortArr = [], ranks = [];
		for (var i=0; i<popSize; i++) {
			sortArr.push(i);
			ranks.push(0);
		}
		
		// sort sortArr from low fitness to high fitness individiuals
		var sortFn = function (a,b) {
			return fitnesses[a] - fitnesses[b];
		};
	
		sortArr.sort(sortFn);
		
		// entry 0 in ranks is the worst individual
		for (i=0; i<popSize; i++) {
			ranks[sortArr[i]] = i;
		}
	};
	

	// initialize random population
	for (var i=0; i<popSize; i++) {
		population[i] = randomFunction();
	}
	
	// loop over all new individuals and compute their fitness
	for (i=0; i<popSize; i++) {
		var f = evaluateFitness(population[i]);
		fitnesses[i] = f;
		sumFitness += f;
		if (f > maxFitness) {
			maxFitness = f;
		}
	}	
	
	// run evolution
	while (stop() === false) {
		// move the last generation out of the way so that we can create a new one
		generation++;
		prevPopulation = population;
		population = [];
		prevFitnesses = fitnesses;
		fitnesses = [];
		prevMaxFitness = maxFitness;
		
		// breed new generation from previous one
		breedingElitism();
		breeding();
		mutation();
	
		if (spec.debug) {
			console.log('Evaluating fitnesses for generation ' + generation);
		}
		
		// reset the intra-generation fitness stats
		if (eliteSize === 0) {
			maxFitness = -Infinity;
		}
		sumFitness = 0;
		for (i=0; i<eliteSize; i++) {
			sumFitness += prevFitnesses[i];
		}
		
		// loop over all new individuals and compute their fitness
		for (i=eliteSize; i<popSize; i++) {
			var f = evaluateFitness(population[i]);
			fitnesses[i] = f;
			sumFitness += f;
			if (f > maxFitness) {
				maxFitness = f;
			}
		}
		
		// do the bookkeeping (for histories)
		maxFitnessHistory.push(maxFitness);
		mean = sumFitness/popSize;
		avgFitnessHistory.push(mean);
		stdevSum = 0;
		for (i=0; i<popSize; i++) {
			stdevSum += (mean - fitnesses[i]) * (mean - fitnesses[i]);
		}
		stdevFitnessHistory.push(Math.sqrt(stdevSum/popSize));
		
		// update counter that keeps track of how long the max fitness hasn't changed (used by some stop conditions)
		if (prevMaxFitness <= maxFitness) {
			staticFitnessGenCount++;
		}	
	}
	
	return {
		/**
		* Return the fittest individual.
		* @function
		* @public
		*/
		getFittest : function () {
			var fittestIndex = 0, fittestFitness = fitnesses[0];
			for (var i=1; i<popSize; i++) {
				if (fitnesses[i] > fittestFitness) {
					fittestFitness = fitnesses[i];
					fittestIndex = i;
				}
			} 
			return population[fittestIndex];
		},
		
		/**
		* Return an array with the max fitness for each generation.
		* @function
		* @public
		*/		
		getMaxFitnessHistory : function () {
			return maxFitnessHistory;
		},
		
		/**
		* Return an array with the average (mean) fitness for each generation.
		* @function
		* @public
		*/		
		getAvgFitnessHistory : function () {
			return avgFitnessHistory;
		},
		
		/**
		* Return an array with the average (mean) fitness for each generation.
		* @function
		* @public
		*/		
		getStdevFitnessHistory : function () {
			return stdevFitnessHistory;
		}
	};
};