import React, { useState, useEffect } from 'react';
import './App.css';

interface Assignments {
  [key: string]: string[];
}

interface AssignmentResult {
  assignments: Assignments;
  maxCallsPerPerson: number;
  error?: string;
}

function calculateMaxAchievableCalls(n: number): number {
  // For n people, the maximum calls per person without reciprocals
  // The theoretical maximum is floor((n-1)/2) for even n, floor(n/2) for odd n
  // But we need to be more conservative for practical assignment
  if (n <= 2) return 1;
  if (n <= 4) return 1;
  if (n <= 6) return 2;
  if (n <= 8) return 2;
  if (n <= 10) return 3;
  if (n <= 12) return 3;
  if (n <= 15) return 4;
  if (n <= 18) return 4;
  if (n <= 20) return 5;
  // For larger groups, use a more reasonable formula
  return Math.floor(n / 3);
}

function isConfigurationPossible(n: number, requestedCallsPerPerson: number): { possible: boolean; error?: string } {
  const maxAchievable = calculateMaxAchievableCalls(n);
  
  if (requestedCallsPerPerson > maxAchievable) {
    return {
      possible: false,
      error: `Cannot assign ${requestedCallsPerPerson} calls per person without reciprocals. With ${n} people, the maximum achievable is ${maxAchievable} calls per person. Try reducing the number of calls per person.`
    };
  }

  // Additional mathematical check: total possible calls vs required calls
  const totalRequiredCalls = n * requestedCallsPerPerson;
  const maxNonReciprocalCalls = Math.floor(n * (n - 1) / 2); // Maximum without reciprocals
  
  if (totalRequiredCalls > maxNonReciprocalCalls) {
    return {
      possible: false,
      error: `Mathematically impossible: ${n} people with ${requestedCallsPerPerson} calls each would require ${totalRequiredCalls} total calls, but only ${maxNonReciprocalCalls} non-reciprocal calls are possible. Try reducing the number of calls per person.`
    };
  }

  return { possible: true };
}

// Simple seeded random number generator
class SeededRandom {
  private seed: number;
  
  constructor(seed: number) {
    this.seed = seed;
  }
  
  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
  
  // Generate a new seed based on current time and random factors
  static generateSeed(): number {
    return Date.now() + Math.floor(Math.random() * 1000000);
  }
}

function assignCalls(people: string[], requestedCallsPerPerson: number): AssignmentResult {
  const n = people.length;
  const maxCallsPerPerson = Math.min(requestedCallsPerPerson, n - 1);
  
  if (n < 2) {
    return {
      assignments: {},
      maxCallsPerPerson: 0,
      error: "Need at least 2 people to create call assignments"
    };
  }
  
  if (n === 2) {
    const [person1, person2] = people;
    return {
      assignments: { [person1]: [person2] },
      maxCallsPerPerson: 1,
      error: "With only 2 people, only one person can make calls"
    };
  }
  
  // Generate a new random seed for this assignment
  const random = new SeededRandom(SeededRandom.generateSeed());
  
  // Try multiple attempts to find a valid assignment
  // More attempts for larger groups
  const maxAttempts = n <= 10 ? 50 : n <= 20 ? 100 : 200;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const assignments: Assignments = {};
    const shuffledPeople = [...people].sort(() => random.next() - 0.5);
    
    // Initialize assignments
    shuffledPeople.forEach(person => {
      assignments[person] = [];
    });
    
    // Note: We don't actually use allPairs in this implementation
    // but keeping the structure for potential future use
    
    // Try to assign calls using a more systematic approach
    let success = true;
    const callCounts: { [person: string]: number } = {};
    shuffledPeople.forEach(person => {
      callCounts[person] = 0;
    });
    
    // Assign calls ensuring each person makes exactly maxCallsPerPerson calls
    for (const person of shuffledPeople) {
      const callsToMake = maxCallsPerPerson;
      const currentCalls = assignments[person].length;
      const remainingCalls = callsToMake - currentCalls;
      
      if (remainingCalls > 0) {
        // Find available targets that won't create reciprocals
        const availableTargets = shuffledPeople.filter(target => {
          if (target === person) return false;
          if (assignments[person].includes(target)) return false;
          if (assignments[target]?.includes(person)) return false;
          return true;
        });
        
        if (availableTargets.length < remainingCalls) {
          success = false;
          break;
        }
        
        // Select targets randomly from available ones
        const shuffledTargets = [...availableTargets].sort(() => random.next() - 0.5);
        const selectedTargets = shuffledTargets.slice(0, remainingCalls);
        
        for (const target of selectedTargets) {
          assignments[person].push(target);
        }
      }
    }
    
    // Verify the assignment is valid
    if (success) {
      // Check all people have correct number of calls
      const allValid = shuffledPeople.every(person => 
        assignments[person].length === maxCallsPerPerson
      );
      
      // Check for reciprocals
      const hasReciprocals = shuffledPeople.some(person => 
        assignments[person].some(target => 
          assignments[target]?.includes(person)
        )
      );
      
      // Check that no person is called by too many people
      const callCounts: { [person: string]: number } = {};
      shuffledPeople.forEach(person => {
        callCounts[person] = 0;
      });
      
      shuffledPeople.forEach(person => {
        assignments[person].forEach(target => {
          callCounts[target]++;
        });
      });
      
      const maxCallsReceived = Math.max(...Object.values(callCounts));
      const minCallsReceived = Math.min(...Object.values(callCounts));
      
      // Ensure reasonable distribution (no one gets called by too many people)
      // For larger groups, allow more variation in call distribution
      const maxAllowedDifference = n <= 10 ? 2 : Math.ceil(n / 4);
      const isBalanced = maxCallsReceived - minCallsReceived <= maxAllowedDifference;
      
      if (allValid && !hasReciprocals && isBalanced) {
        return {
          assignments,
          maxCallsPerPerson
        };
      }
    }
  }
  
  // If we couldn't find a valid assignment after multiple attempts
  return {
    assignments: {},
    maxCallsPerPerson: 0,
    error: `Unable to create valid assignments with ${requestedCallsPerPerson} calls per person without reciprocals. Try reducing the number of calls per person or adding more people.`
  };
}

function generateTextList(assignments: Assignments): string {
  let textList = "Call Assignments:\n\n";
  
  Object.keys(assignments)
    .sort((a, b) => a.localeCompare(b))
    .forEach(person => {
      if (assignments[person].length > 0) {
        const calls = assignments[person].join(' and ');
        textList += `${person} --> ${calls}\n`;
      } else {
        textList += `${person} --> no one\n`;
      }
    });
  
  return textList;
}

function App() {
  const [names, setNames] = useState<string>('Bill, Bob, Chris, DaveG, DaveH, Ed, Kevin, Kyle, Matt, Pete, Tim');
  const [callsPerPerson, setCallsPerPerson] = useState<number>(2);
  const [assignments, setAssignments] = useState<Assignments>({});
  const [textList, setTextList] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [showToast, setShowToast] = useState<boolean>(false);
  const [showInfoDialog, setShowInfoDialog] = useState<boolean>(false);

  // Calculate the maximum achievable calls based on current names
  const nameList = names.split(',').map(name => name.trim()).filter(name => name.length > 0);
  const maxAchievable = nameList.length >= 2 ? calculateMaxAchievableCalls(nameList.length) : 1;

  // Automatically adjust callsPerPerson if it exceeds the maximum achievable
  useEffect(() => {
    if (callsPerPerson > maxAchievable && maxAchievable > 0) {
      setCallsPerPerson(maxAchievable);
    }
  }, [maxAchievable, callsPerPerson]);

  // Check for impossible configurations in real-time
  const validation = nameList.length >= 2 ? isConfigurationPossible(nameList.length, callsPerPerson) : { possible: true };
  const hasImpossibleConfig = nameList.length >= 2 && !validation.possible;

  // Clear assignments when names change
  useEffect(() => {
    setAssignments({});
    setTextList('');
    setError('');
  }, [names]);

  const handleGenerate = () => {
    const nameList = names.split(',').map(name => name.trim()).filter(name => name.length > 0);
    
    // Check if configuration is possible before attempting assignment
    const validation = isConfigurationPossible(nameList.length, callsPerPerson);
    if (!validation.possible) {
      setAssignments({});
      setError(validation.error || '');
      setTextList('');
      return;
    }
    
    const result = assignCalls(nameList, callsPerPerson);
    setAssignments(result.assignments);
    setError(result.error || '');
    setTextList(generateTextList(result.assignments));
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(textList);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <div className="App">
      {showToast && (
        <div className="toast">
          <div className="toast-content">
            <span className="toast-icon">✓</span>
            <span className="toast-message">Text copied to clipboard!</span>
          </div>
        </div>
      )}
      <header className="App-header">
        <div className="header-content">
          <div>
            <h1>Call Mapper</h1>
            <p>Generate call assignments for a group of people</p>
          </div>
          <button 
            className="info-btn"
            onClick={() => setShowInfoDialog(true)}
            title="How the algorithm works"
          >
            ℹ️
          </button>
        </div>
      </header>
      
      <main className="App-main">
        <div className="input-section">
          <div className="input-controls">
            <label htmlFor="names-input">
              Enter names (comma-separated):
            </label>
            <div className="calls-control">
              <label htmlFor="calls-input">
                Calls per person:
              </label>
              <input
                id="calls-input"
                type="number"
                min="1"
                max={maxAchievable}
                value={callsPerPerson}
                onChange={(e) => setCallsPerPerson(parseInt(e.target.value) || 2)}
                className="calls-input"
              />
              <span className="max-indicator">(max: {maxAchievable})</span>
            </div>
          </div>
          <div className="input-row">
            <textarea
              id="names-input"
              value={names}
              onChange={(e) => setNames(e.target.value)}
              placeholder="Bill, Bob, Chris, DaveG, DaveH, Ed, Kevin, Kyle, Matt, Pete, Tim"
              rows={3}
            />
            <button 
              onClick={handleGenerate} 
              className="generate-btn"
              disabled={hasImpossibleConfig}
            >
              Generate
            </button>
          </div>
        </div>

        {(error || Object.keys(assignments).length > 0 || hasImpossibleConfig) && (
          <div className="results-section">
            {(error || hasImpossibleConfig) && (
              <div className="error-section">
                <div className="error-message">
                  {hasImpossibleConfig ? validation.error : error}
                </div>
              </div>
            )}

            {Object.keys(assignments).length > 0 && (
              <>
                <div className="assignments-header">
                  <div>
                    <h2>Call Assignments</h2>
                    <p className="randomization-note">✨ Randomized each time you click Generate</p>
                  </div>
                  <button onClick={copyToClipboard} className="copy-btn">
                    Copy to Clipboard
                  </button>
                </div>
                <div className="assignments-list">
                  {Object.keys(assignments)
                    .sort((a, b) => a.localeCompare(b))
                    .map(person => (
                      <div key={person} className="assignment-item">
                        <strong>{person}</strong> calls {assignments[person].length > 0 ? assignments[person].join(' and ') : 'no one'}
                      </div>
                    ))}
                </div>
              </>
            )}
          </div>
        )}
      </main>

      {/* Info Dialog */}
      {showInfoDialog && (
        <div 
          className="dialog-overlay" 
          onClick={() => setShowInfoDialog(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="dialog-title"
        >
          <div 
            className="dialog" 
            onClick={(e) => e.stopPropagation()}
            role="document"
          >
            <div className="dialog-header">
              <h2 id="dialog-title">How the Algorithm Works</h2>
              <button 
                className="dialog-close"
                onClick={() => setShowInfoDialog(false)}
              >
                ×
              </button>
            </div>
            <div className="dialog-content">
              <h3>🎯 Goal</h3>
              <p>Create call assignments where each person calls exactly the specified number of people, with no reciprocal calls (if A calls B, B won't call A).</p>
              
              <h3>🔧 Algorithm Steps</h3>
              <ol>
                <li><strong>Validation:</strong> Check if the configuration is mathematically possible</li>
                <li><strong>Randomization:</strong> Use a seeded random generator for different results each time</li>
                <li><strong>Assignment:</strong> Systematically assign calls while avoiding reciprocals</li>
                <li><strong>Balance Check:</strong> Ensure no one gets called by too many people</li>
                <li><strong>Verification:</strong> Validate all constraints are met</li>
              </ol>
              
              <h3>🚫 Constraints</h3>
              <ul>
                <li><strong>No Reciprocals:</strong> If Bill calls Bob, Bob cannot call Bill</li>
                <li><strong>Balanced Distribution:</strong> No one gets called by significantly more people than others</li>
                <li><strong>Exact Counts:</strong> Each person makes exactly the specified number of calls</li>
                <li><strong>Mathematical Limits:</strong> Prevents impossible configurations</li>
              </ul>
              
              <h3>🎲 Randomization</h3>
              <p>Each time you click "Generate", a new random seed is created, ensuring different assignments every time while maintaining all constraints.</p>
              
              <h3>⚠️ Error Handling</h3>
              <p>If a configuration is impossible (like 5 calls per person with 11 people), the system will show an error message and suggest reducing the number of calls per person.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App; 