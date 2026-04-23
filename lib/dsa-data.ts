export type DsaPriority = "MUST DO" | "HIGH";

export type DsaDifficulty = "Easy" | "Medium" | "Hard";

export type DsaVaultState =
  | "NOT_SOLVED"
  | "ATTEMPTED"
  | "REVISION"
  | "SOLVED"
  | "GOOD_PROBLEM";

export type DsaProblem = {
  id: number;
  name: string;
  platform: string;
  url: string;
  topic: string;
  difficulty: DsaDifficulty;
  priority: DsaPriority;
  tags: string[];
  pattern: string;
};

export type DsaWeekTheme = {
  week: number;
  theme: string;
  topics: string[];
};

const RAW_DSA_CSV = `S.No,Topic,Problem Title,Platform,Difficulty,Problem Link,Key Tags,One-Line Hint
1,Arrays & Strings,Turbo Sort,CodeChef,Easy,https://www.codechef.com/problems/TSORT,Arrays; Sorting,Just sort a large array efficiently - think about which sort runs in O(n log n) within tight constraints.
2,Arrays & Strings,Chef and Strings,CodeChef,Easy,https://www.codechef.com/problems/CHEFSTR,Arrays; Strings; Frequency Count,Count character frequencies and compare two strings character by character.
3,Arrays & Strings,The Minimum Number of Moves,CodeChef,Easy,https://www.codechef.com/problems/MOVES,Arrays; Greedy,Think about what the optimal move looks like for each element in the array.
4,Arrays & Strings,Best Time to Buy and Sell Stock,LeetCode,Easy,https://leetcode.com/problems/best-time-to-buy-and-sell-stock/,Arrays; Greedy; Single Pass,Track the minimum price seen so far and update max profit on every day.
5,Arrays & Strings,Maximum Subarray,LeetCode,Easy,https://leetcode.com/problems/maximum-subarray/,Arrays; DP; Kadane's Algorithm,Use Kadane's algorithm - extend the current subarray or start fresh.
6,Arrays & Strings,Rotate Array,LeetCode,Medium,https://leetcode.com/problems/rotate-array/,Arrays; Two Pointers; Reversal,Reverse the whole array then reverse the two parts separately.
7,Arrays & Strings,Chef and Rainbow Array,CodeChef,Medium,https://www.codechef.com/problems/ACM14KP1,Arrays; Prefix Sum; Observation,Look for a pattern in how values change across the array.
8,Arrays & Strings,Pangram Check,CodeChef,Easy,https://www.codechef.com/problems/PANGRAM,Strings; Hashing; Bitmask,Use a boolean frequency array of 26 characters.
9,Arrays & Strings,Longest Common Prefix,LeetCode,Easy,https://leetcode.com/problems/longest-common-prefix/,Strings; Sorting,Sort the array and compare only the first and last strings.
10,Arrays & Strings,Group Anagrams,LeetCode,Medium,https://leetcode.com/problems/group-anagrams/,Strings; Hashing,Sort each string as a key in a hashmap and group by key.
11,Arrays & Strings,Anagram Strings,CodeChef,Easy,https://www.codechef.com/problems/ANAGRAM,Strings; Sorting; Frequency Count,Sort both strings and check if they are identical.
12,Arrays & Strings,Minimum Window Substring,LeetCode,Hard,https://leetcode.com/problems/minimum-window-substring/,Strings; Sliding Window; Hashing,Use a sliding window and frequency map to track when all chars are covered.
13,Searching & Sorting,Binary Search,CodeChef,Easy,https://www.codechef.com/problems/BSEARCH1,Binary Search,Classic binary search implementation - find the target in a sorted array.
14,Searching & Sorting,Aggressive Cows,CodeChef,Medium,https://www.codechef.com/problems/AGGRCOW,Binary Search on Answer; Greedy,Binary search on the minimum distance; check feasibility greedily.
15,Searching & Sorting,Chef and Chessboard,CodeChef,Medium,https://www.codechef.com/problems/CBOARD,Sorting; Greedy; Observation,Think about how to pair chessboard colors after sorting.
16,Searching & Sorting,Search in Rotated Sorted Array,LeetCode,Medium,https://leetcode.com/problems/search-in-rotated-sorted-array/,Binary Search; Arrays,Determine which half is sorted and decide which half to recurse on.
17,Searching & Sorting,Median of Two Sorted Arrays,LeetCode,Hard,https://leetcode.com/problems/median-of-two-sorted-arrays/,Binary Search; Arrays; Partitioning,Binary search on the partition point of the smaller array.
18,Searching & Sorting,Merge Intervals,LeetCode,Medium,https://leetcode.com/problems/merge-intervals/,Sorting; Arrays; Intervals,Sort by start time and merge overlapping intervals greedily.
19,Searching & Sorting,Kth Largest Element in an Array,LeetCode,Medium,https://leetcode.com/problems/kth-largest-element-in-an-array/,Sorting; Heap; Quickselect,Use a min-heap of size K or the Quickselect algorithm.
20,Searching & Sorting,Inversion Count,GeeksForGeeks,Medium,https://www.geeksforgeeks.org/problems/inversion-of-array-1587115620/1,Sorting; Merge Sort; Divide and Conquer,Count inversions during the merge step of merge sort.
21,Recursion & Backtracking,N-Queens,LeetCode,Hard,https://leetcode.com/problems/n-queens/,Backtracking; Recursion,Place queens row by row and backtrack when a conflict is detected.
22,Recursion & Backtracking,Sudoku Solver,LeetCode,Hard,https://leetcode.com/problems/sudoku-solver/,Backtracking; Recursion,For each empty cell try digits 1-9 and backtrack on violation.
23,Recursion & Backtracking,Subsets,LeetCode,Medium,https://leetcode.com/problems/subsets/,Recursion; Backtracking; Bit Manipulation,At each step decide to include or exclude the current element.
24,Recursion & Backtracking,Permutations,LeetCode,Medium,https://leetcode.com/problems/permutations/,Recursion; Backtracking,Swap elements and recurse; backtrack by swapping back.
25,Recursion & Backtracking,Letter Combinations of a Phone Number,LeetCode,Medium,https://leetcode.com/problems/letter-combinations-of-a-phone-number/,Recursion; Backtracking; Strings,Map each digit to letters and build combinations recursively.
26,Recursion & Backtracking,Chef and Towers of Hanoi,CodeChef,Easy,https://www.codechef.com/problems/TOWERHAN,Recursion; Math,Classic Tower of Hanoi - the answer is 2^N - 1 moves.
27,Recursion & Backtracking,Rat in a Maze,GeeksForGeeks,Medium,https://www.geeksforgeeks.org/problems/rat-in-a-maze-problem/1,Backtracking; DFS; Matrix,Try all four directions recursively and backtrack when a path is blocked.
28,Recursion & Backtracking,Word Search,LeetCode,Medium,https://leetcode.com/problems/word-search/,Backtracking; DFS; Matrix,DFS with backtracking marking visited cells to avoid reuse.
29,Linked Lists,Reverse Linked List,LeetCode,Easy,https://leetcode.com/problems/reverse-linked-list/,Linked List; Iterative; Recursion,Iteratively reverse the next pointers of each node.
30,Linked Lists,Linked List Cycle Detection,CodeChef,Easy,https://www.codechef.com/problems/LLCYCLE,Linked List; Floyd's Algorithm,Use Floyd's slow-fast pointer cycle detection algorithm.
31,Linked Lists,Merge Two Sorted Lists,LeetCode,Easy,https://leetcode.com/problems/merge-two-sorted-lists/,Linked List; Recursion; Two Pointers,Compare heads and recursively build the merged list.
32,Linked Lists,LRU Cache,LeetCode,Medium,https://leetcode.com/problems/lru-cache/,Doubly Linked List; Hashing; Design,Combine a HashMap with a Doubly Linked List for O(1) get and put.
33,Linked Lists,Reverse Nodes in k-Group,LeetCode,Hard,https://leetcode.com/problems/reverse-nodes-in-k-group/,Linked List; Recursion,Reverse each group of K nodes then recursively handle the remainder.
34,Linked Lists,Flatten a Multilevel Doubly Linked List,LeetCode,Medium,https://leetcode.com/problems/flatten-a-multilevel-doubly-linked-list/,Doubly Linked List; DFS; Recursion,Whenever a child exists flatten it into the main list before continuing.
35,Linked Lists,Circular Linked List Insertion,CodeChef,Medium,https://www.codechef.com/problems/CIRLIST,Circular Linked List; Pointer Manipulation,Handle the wrap-around case carefully when inserting in a sorted circular list.
36,Linked Lists,Find Middle of Linked List,CodeChef,Easy,https://www.codechef.com/problems/MIDLIST,Linked List; Two Pointers,Use slow and fast pointers - slow stops at the middle when fast reaches the end.
37,Stacks & Queues,Valid Parentheses,LeetCode,Easy,https://leetcode.com/problems/valid-parentheses/,Stack,Push opening brackets and pop on each closing bracket.
38,Stacks & Queues,Next Greater Element,GeeksForGeeks,Medium,https://www.geeksforgeeks.org/problems/next-larger-element-1587115620/1,Stack; Monotonic Stack,Use a monotonic decreasing stack and resolve elements when a greater is found.
39,Stacks & Queues,Largest Rectangle in Histogram,LeetCode,Hard,https://leetcode.com/problems/largest-rectangle-in-histogram/,Stack; Monotonic Stack,Maintain a monotonic stack of indices and compute area when popping.
40,Stacks & Queues,Sliding Window Maximum,LeetCode,Hard,https://leetcode.com/problems/sliding-window-maximum/,Monotonic Queue; Deque; Sliding Window,Use a deque to maintain indices of useful elements in the current window.
41,Stacks & Queues,Min Stack,LeetCode,Medium,https://leetcode.com/problems/min-stack/,Stack; Design,Maintain a second stack that tracks the minimum at every level.
42,Stacks & Queues,Decode String,LeetCode,Medium,https://leetcode.com/problems/decode-string/,Stack; Recursion; Strings,Push current string and repeat count onto stack when you encounter '['.
43,Stacks & Queues,Stack with Array,CodeChef,Easy,https://www.codechef.com/problems/STACKS,Stack; Implementation,Implement push pop and getMin operations using an array-based stack.
44,Stacks & Queues,Queue using Two Stacks,GeeksForGeeks,Easy,https://www.geeksforgeeks.org/problems/queue-using-two-stacks/1,Queue; Stack; Design,Use one stack for enqueue and another for dequeue; transfer lazily.
45,Stacks & Queues,Celebrity Problem,CodeChef,Medium,https://www.codechef.com/problems/CELEB,Stack; Elimination; Graph,Eliminate non-celebrities using a stack; verify the remaining candidate.
46,Stacks & Queues,Trapping Rain Water,LeetCode,Hard,https://leetcode.com/problems/trapping-rain-water/,Stack; Two Pointers; Arrays,Use a monotonic stack or two-pointer approach tracking max heights.
47,Hashing & Prefix Sum,Two Sum,LeetCode,Easy,https://leetcode.com/problems/two-sum/,Hashing; Arrays,Store complements in a hashmap and look up each element.
48,Hashing & Prefix Sum,Subarray Sum Equals K,LeetCode,Medium,https://leetcode.com/problems/subarray-sum-equals-k/,Prefix Sum; Hashing,Store prefix sum frequencies; check if (prefix - k) has been seen.
49,Hashing & Prefix Sum,DQUERY - D-query,CodeChef,Medium,https://www.codechef.com/problems/DQUERY,Prefix Sum; Offline Queries; BIT,Sort queries by right endpoint and use a BIT to count distinct elements.
50,Hashing & Prefix Sum,Longest Consecutive Sequence,LeetCode,Medium,https://leetcode.com/problems/longest-consecutive-sequence/,Hashing; Arrays,Use a HashSet; only start counting from elements with no left neighbor.
51,Hashing & Prefix Sum,Chef and Prefix Sums,CodeChef,Medium,https://www.codechef.com/problems/CHEFSUMS,Prefix Sum; Arrays; Math,Derive original array from prefix sums using simple differences.
52,Hashing & Prefix Sum,Count Distinct Elements in Every Window,GeeksForGeeks,Medium,https://www.geeksforgeeks.org/problems/count-distinct-elements-in-every-window/1,Hashing; Sliding Window,Use a frequency hashmap and slide the window updating counts.
53,Hashing & Prefix Sum,4Sum Count,LeetCode,Medium,https://leetcode.com/problems/4sum-ii/,Hashing; Divide and Conquer,Split into two pairs; hash sums of the first pair and look up negatives.
54,Trees,Invert Binary Tree,LeetCode,Easy,https://leetcode.com/problems/invert-binary-tree/,Binary Tree; Recursion,Swap left and right children at every node recursively.
55,Trees,Lowest Common Ancestor of BST,LeetCode,Medium,https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/,BST; Recursion; Tree Traversal,Use BST property - if both nodes smaller go left; if both larger go right.
56,Trees,Binary Tree Level Order Traversal,LeetCode,Medium,https://leetcode.com/problems/binary-tree-level-order-traversal/,BFS; Binary Tree; Queue,BFS level by level using a queue; capture all nodes at each level.
57,Trees,Diameter of Binary Tree,LeetCode,Easy,https://leetcode.com/problems/diameter-of-binary-tree/,Binary Tree; Recursion; DFS,At each node the diameter is left height + right height; track the global max.
58,Trees,Validate BST,LeetCode,Medium,https://leetcode.com/problems/validate-binary-search-tree/,BST; DFS; Recursion,Pass valid min and max range for each node and check the BST property.
59,Trees,Symmetric Tree,CodeChef,Easy,https://www.codechef.com/problems/SYMTREE,Binary Tree; Recursion; BFS,Check if left and right subtrees are mirror images of each other.
60,Trees,Serialize and Deserialize Binary Tree,LeetCode,Hard,https://leetcode.com/problems/serialize-and-deserialize-binary-tree/,Binary Tree; BFS; Design,BFS serialize with null markers; reconstruct level by level.
61,Trees,Construct Binary Tree from Preorder and Inorder,LeetCode,Medium,https://leetcode.com/problems/construct-binary-tree-from-preorder-and-inorder-traversal/,Binary Tree; Divide and Conquer; Hashing,Preorder root splits inorder into left and right subtrees recursively.
62,Trees,Chef and Trees,CodeChef,Medium,https://www.codechef.com/problems/CHEFTREE,Binary Tree; DFS; Counting,DFS-based tree traversal with counting conditions along paths.
63,Trees,Binary Search Tree Operations,CodeChef,Medium,https://www.codechef.com/problems/BSTOPS,BST; Insertion; Deletion; Search,Implement insert delete and search in a BST following standard BST rules.
64,Trees,Path Sum II,LeetCode,Medium,https://leetcode.com/problems/path-sum-ii/,Binary Tree; Backtracking; DFS,DFS collecting paths and backtrack after visiting each node.
65,Heaps & Priority Queues,Kth Largest in a Stream,LeetCode,Easy,https://leetcode.com/problems/kth-largest-element-in-a-stream/,Heap; Priority Queue; Design,Maintain a min-heap of size K - the root is always the Kth largest.
66,Heaps & Priority Queues,Merge K Sorted Lists,LeetCode,Hard,https://leetcode.com/problems/merge-k-sorted-lists/,Heap; Linked List; Priority Queue,Use a min-heap to always extract the global minimum from K lists.
67,Heaps & Priority Queues,Find Median from Data Stream,LeetCode,Hard,https://leetcode.com/problems/find-median-from-data-stream/,Heap; Two Heaps; Design,Maintain a max-heap for lower half and a min-heap for upper half.
68,Heaps & Priority Queues,Top K Frequent Elements,LeetCode,Medium,https://leetcode.com/problems/top-k-frequent-elements/,Heap; Hashing; Bucket Sort,Build frequency map then use a min-heap of size K.
69,Heaps & Priority Queues,CHEFSOC - Chef and Soccer,CodeChef,Medium,https://www.codechef.com/problems/CHEFSOC,Heap; Greedy; Simulation,Use a priority queue to simulate optimal event selection.
70,Heaps & Priority Queues,Running Median,CodeChef,Hard,https://www.codechef.com/problems/RUNMEDIAN,Heap; Two Heaps; Stream,Balance two heaps dynamically to keep the median accessible in O(log n).
71,Heaps & Priority Queues,Task Scheduler,LeetCode,Medium,https://leetcode.com/problems/task-scheduler/,Heap; Greedy; Simulation,Use a max-heap by frequency and cooldown queue to schedule optimally.
72,Graphs,BFS of Graph,GeeksForGeeks,Easy,https://www.geeksforgeeks.org/problems/bfs-traversal-of-graph/1,Graph; BFS; Traversal,Use a queue; mark visited before enqueuing each neighbor.
73,Graphs,DFS of Graph,GeeksForGeeks,Easy,https://www.geeksforgeeks.org/problems/depth-first-traversal-for-a-graph/1,Graph; DFS; Traversal,Recursively visit each unvisited neighbor using a visited array.
74,Graphs,Number of Islands,LeetCode,Medium,https://leetcode.com/problems/number-of-islands/,Graph; BFS; DFS; Matrix,Flood-fill each unvisited land cell and count how many fills you do.
75,Graphs,Dijkstra's Shortest Path,CodeChef,Medium,https://www.codechef.com/problems/DIGJUMP,Graph; Dijkstra; Shortest Path,Relax edges using a min-heap priority queue.
76,Graphs,Topological Sort,CodeChef,Medium,https://www.codechef.com/problems/TOPOSORT,Graph; DAG; Topological Sort; BFS,Use Kahn's algorithm with in-degree counting and a queue.
77,Graphs,Minimum Spanning Tree,CodeChef,Medium,https://www.codechef.com/problems/MSTQS,Graph; Kruskal; MST; Union-Find,Sort edges by weight and use Union-Find to avoid cycles.
78,Graphs,Word Ladder,LeetCode,Hard,https://leetcode.com/problems/word-ladder/,Graph; BFS; Strings,Model as graph where edges connect words differing by one letter; BFS for shortest path.
79,Graphs,Course Schedule,LeetCode,Medium,https://leetcode.com/problems/course-schedule/,Graph; Topological Sort; Cycle Detection,Detect a cycle in a directed graph using DFS or Kahn's algorithm.
80,Graphs,Floyd-Warshall All Pairs,CodeChef,Hard,https://www.codechef.com/problems/FWALLP,Graph; Dynamic Programming; Floyd-Warshall,Use triple nested loop - DP[i][j] via intermediate vertex k.
81,Graphs,Bellman-Ford Negative Cycle,CodeChef,Hard,https://www.codechef.com/problems/NEGCYC,Graph; Bellman-Ford; Shortest Path,Run Bellman-Ford for V-1 iterations; if distance still updates there's a negative cycle.
82,Graphs,Clone Graph,LeetCode,Medium,https://leetcode.com/problems/clone-graph/,Graph; DFS; Hashing,Use a hashmap from original to clone nodes; DFS to copy edges.
83,Dynamic Programming,Climbing Stairs,LeetCode,Easy,https://leetcode.com/problems/climbing-stairs/,DP; 1D DP; Fibonacci,dp[i] = dp[i-1] + dp[i-2] - identical to Fibonacci.
84,Dynamic Programming,0/1 Knapsack,CodeChef,Medium,https://www.codechef.com/problems/KNAP,DP; Knapsack; 2D DP,Classic 0/1 knapsack - dp[i][w] max value with i items and capacity w.
85,Dynamic Programming,Longest Increasing Subsequence,LeetCode,Medium,https://leetcode.com/problems/longest-increasing-subsequence/,DP; LIS; Binary Search,O(n log n) solution using patience sorting with binary search.
86,Dynamic Programming,Edit Distance,LeetCode,Hard,https://leetcode.com/problems/edit-distance/,DP; 2D DP; Strings,dp[i][j] = min operations to convert first i chars to first j chars.
87,Dynamic Programming,Coin Change,LeetCode,Medium,https://leetcode.com/problems/coin-change/,DP; 1D DP; Unbounded Knapsack,dp[i] = min coins for amount i; try every coin for each subproblem.
88,Dynamic Programming,Matrix Chain Multiplication,CodeChef,Hard,https://www.codechef.com/problems/MATCHAIN,DP; Interval DP,Try every split point k in dp[i][j] and take the minimum cost.
89,Dynamic Programming,DP on Trees - Tree Diameter,CodeChef,Hard,https://www.codechef.com/problems/TREEROOT,DP on Trees; DFS; Tree,At each node compute max depth of left and right subtrees; track global maximum path.
90,Dynamic Programming,Longest Common Subsequence,LeetCode,Medium,https://leetcode.com/problems/longest-common-subsequence/,DP; 2D DP; Strings,dp[i][j] = LCS of first i chars of s1 and first j chars of s2.
91,Dynamic Programming,Partition Equal Subset Sum,LeetCode,Medium,https://leetcode.com/problems/partition-equal-subset-sum/,DP; Subset Sum; 0/1 Knapsack,Check if subset with sum = total/2 exists using boolean DP.
92,Dynamic Programming,Burst Balloons,LeetCode,Hard,https://leetcode.com/problems/burst-balloons/,DP; Interval DP,Think of the last balloon to burst in each interval - interval DP.
93,Dynamic Programming,DP on Graphs - Shortest Path DAG,CodeChef,Medium,https://www.codechef.com/problems/DAGSHORT,DP; DAG; Shortest Path,Process vertices in topological order and relax edges.
94,Greedy Algorithms,Activity Selection,CodeChef,Easy,https://www.codechef.com/problems/ACTSELCT,Greedy; Sorting; Intervals,Sort by end time; always pick the activity that finishes earliest.
95,Greedy Algorithms,Fractional Knapsack,GeeksForGeeks,Medium,https://www.geeksforgeeks.org/problems/fractional-knapsack-1587115620/1,Greedy; Sorting,Sort by value/weight ratio and greedily fill the knapsack.
96,Greedy Algorithms,Jump Game,LeetCode,Medium,https://leetcode.com/problems/jump-game/,Greedy; Arrays,Track the farthest reachable index; if you pass it you're stuck.
97,Greedy Algorithms,Gas Station,LeetCode,Medium,https://leetcode.com/problems/gas-station/,Greedy; Circular Array,If total gas >= total cost a solution exists; start from where balance goes negative.
98,Greedy Algorithms,Candy,LeetCode,Hard,https://leetcode.com/problems/candy/,Greedy; Two Pass; Arrays,Two passes - left to right then right to left - satisfying neighbor constraints.
99,Greedy Algorithms,Minimum Number of Platforms,GeeksForGeeks,Medium,https://www.geeksforgeeks.org/problems/minimum-platforms-1587115620/1,Greedy; Sorting; Two Pointers,Sort arrivals and departures; use a two-pointer sweep to count overlaps.
100,Greedy Algorithms,Chef and Coins,CodeChef,Medium,https://www.codechef.com/problems/COINS,Greedy; Math,Greedily use largest denominations first to minimize coin count.
101,Bit Manipulation,Single Number,LeetCode,Easy,https://leetcode.com/problems/single-number/,Bit Manipulation; XOR,XOR all elements - pairs cancel out leaving the unique element.
102,Bit Manipulation,Number of 1 Bits,LeetCode,Easy,https://leetcode.com/problems/number-of-1-bits/,Bit Manipulation,Use n & (n-1) to drop the lowest set bit repeatedly and count.
103,Bit Manipulation,Subsets using Bitmask,LeetCode,Medium,https://leetcode.com/problems/subsets/,Bit Manipulation; Recursion,Enumerate all 2^N bitmasks to generate every subset.
104,Bit Manipulation,Reverse Bits,LeetCode,Easy,https://leetcode.com/problems/reverse-bits/,Bit Manipulation,Extract bits right to left and place them left to right.
105,Bit Manipulation,Maximum XOR of Two Numbers,LeetCode,Medium,https://leetcode.com/problems/maximum-xor-of-two-numbers-in-an-array/,Bit Manipulation; Trie,Build a Trie of binary representations and greedily choose opposite bits.
106,Bit Manipulation,Chef and Bits,CodeChef,Medium,https://www.codechef.com/problems/CHEFBIT,Bit Manipulation; Greedy,Use bitwise properties to find the optimal combination.
107,Bit Manipulation,Counting Bits,LeetCode,Easy,https://leetcode.com/problems/counting-bits/,Bit Manipulation; DP,dp[i] = dp[i >> 1] + (i & 1) - halve and check last bit.
108,Sliding Window & Two Pointers,Container With Most Water,LeetCode,Medium,https://leetcode.com/problems/container-with-most-water/,Two Pointers; Greedy,Move the shorter pointer inward to maximize the area.
109,Sliding Window & Two Pointers,Longest Substring Without Repeating Characters,LeetCode,Medium,https://leetcode.com/problems/longest-substring-without-repeating-characters/,Sliding Window; Hashing; Strings,Expand right pointer; shrink left when a duplicate enters the window.
110,Sliding Window & Two Pointers,3Sum,LeetCode,Medium,https://leetcode.com/problems/3sum/,Two Pointers; Sorting; Arrays,Sort the array then use a fixed element with two-pointer search.
111,Sliding Window & Two Pointers,Fruits Into Baskets,CodeChef,Medium,https://www.codechef.com/problems/FRUIT,Sliding Window; Hashing,Use a sliding window with a frequency map; keep at most 2 distinct types.
112,Sliding Window & Two Pointers,Minimum Size Subarray Sum,LeetCode,Medium,https://leetcode.com/problems/minimum-size-subarray-sum/,Sliding Window; Two Pointers,Expand the window greedily and shrink from the left when the sum condition is met.
113,Sliding Window & Two Pointers,Chef and Subarrays,CodeChef,Medium,https://www.codechef.com/problems/CHEFSUBB,Sliding Window; Prefix Sum,Apply sliding window to count subarrays with a condition on the sum.
114,Sliding Window & Two Pointers,Four Sum,LeetCode,Medium,https://leetcode.com/problems/4sum/,Two Pointers; Sorting,Sort and use two nested loops + two-pointer for the innermost pair.
115,Tries,Implement Trie,LeetCode,Medium,https://leetcode.com/problems/implement-trie-prefix-tree/,Trie; Design; Strings,Build a 26-child node structure supporting insert search and startsWith.
116,Tries,Word Search II,LeetCode,Hard,https://leetcode.com/problems/word-search-ii/,Trie; DFS; Backtracking,Insert all words into a Trie then DFS the board pruning with Trie nodes.
117,Tries,Chef and Trie,CodeChef,Medium,https://www.codechef.com/problems/TRIE2,Trie; Strings,Build a trie and count strings sharing a given prefix.
118,Tries,Maximum XOR with Trie,CodeChef,Hard,https://www.codechef.com/problems/XORTRIE,Trie; Bit Manipulation,Insert binary representations into a Trie and greedily pick opposite bits for max XOR.
119,Tries,Palindrome Pairs,LeetCode,Hard,https://leetcode.com/problems/palindrome-pairs/,Trie; Strings; Hashing,For each word check if its reverse exists or if splitting yields palindrome parts.
120,Segment Trees / Fenwick Trees,Range Sum Query - Mutable,LeetCode,Medium,https://leetcode.com/problems/range-sum-query-mutable/,Segment Tree; BIT; Range Query,Use a Fenwick Tree (BIT) for O(log n) point updates and prefix sum queries.
121,Segment Trees / Fenwick Trees,Range Minimum Query,CodeChef,Medium,https://www.codechef.com/problems/RMQSQ,Segment Tree; Range Query,Build a segment tree storing minimums; answer queries in O(log n).
122,Segment Trees / Fenwick Trees,HORRIBLE - Horrible Queries,CodeChef,Hard,https://www.codechef.com/problems/HORRIBLE,Segment Tree; Lazy Propagation; Range Update,Use segment tree with lazy propagation for range add and range sum queries.
123,Segment Trees / Fenwick Trees,Count of Smaller Numbers After Self,LeetCode,Hard,https://leetcode.com/problems/count-of-smaller-numbers-after-self/,BIT; Merge Sort; Segment Tree,Use a BIT with coordinate compression - for each element count smaller to its right.
124,Segment Trees / Fenwick Trees,Chef and Queries,CodeChef,Hard,https://www.codechef.com/problems/CHEFQUER,Segment Tree; Range Query; Lazy Propagation,Use lazy segment tree to handle range updates and point queries efficiently.
125,Disjoint Set Union (Union-Find),Number of Provinces,LeetCode,Medium,https://leetcode.com/problems/number-of-provinces/,DSU; Union-Find; Graph,Union connected cities; count the number of distinct roots.
126,Disjoint Set Union (Union-Find),Making a Large Island,LeetCode,Hard,https://leetcode.com/problems/making-a-large-island/,DSU; Graph; Matrix,Label islands with DSU; for each 0 cell check union of adjacent island sizes.
127,Disjoint Set Union (Union-Find),Kruskal MST with DSU,CodeChef,Medium,https://www.codechef.com/problems/KRUSKALMST,DSU; MST; Greedy; Graph,Sort edges by weight and use DSU to build MST without cycles.
128,Disjoint Set Union (Union-Find),Accounts Merge,LeetCode,Medium,https://leetcode.com/problems/accounts-merge/,DSU; Hashing; Graph,Union emails under the same account; collect and sort each component.
129,Disjoint Set Union (Union-Find),GERALD07 - Chef and Graph Queries,CodeChef,Hard,https://www.codechef.com/problems/GERALD07,DSU; Offline Queries; Bridge Tree,Use offline query processing with DSU on a bridge tree for connectivity.
130,Mathematical Algorithms,GCD and LCM,CodeChef,Easy,https://www.codechef.com/problems/GCDLCM,Math; GCD; Number Theory,Apply Euclidean algorithm; use lcm(a,b) = a*b / gcd(a,b).
131,Mathematical Algorithms,Modular Exponentiation,CodeChef,Easy,https://www.codechef.com/problems/POWMOD,Math; Modular Arithmetic; Fast Power,Use fast exponentiation - square and multiply - with modular reduction.
132,Mathematical Algorithms,Sieve of Eratosthenes,CodeChef,Medium,https://www.codechef.com/problems/PRIMES1,Math; Sieve; Number Theory,Mark multiples iteratively from 2 upward to find all primes up to N.
133,Mathematical Algorithms,nCr Modulo Prime,CodeChef,Medium,https://www.codechef.com/problems/NCRYPRIME,Math; Combinatorics; Modular Arithmetic,Precompute factorials and modular inverses using Fermat's little theorem.
134,Mathematical Algorithms,Catalan Number Applications,CodeChef,Medium,https://www.codechef.com/problems/CATALN,Math; Combinatorics; DP,Use Catalan number formula: C(n) = C(2n,n)/(n+1) with modular arithmetic.
135,Mathematical Algorithms,Chinese Remainder Theorem,Codeforces,Hard,https://codeforces.com/problemset/problem/687/B,Math; CRT; Number Theory,Apply CRT to merge congruences modulo pairwise coprime moduli.
136,Mathematical Algorithms,Extended Euclidean Algorithm,CodeChef,Medium,https://www.codechef.com/problems/EXTGCD,Math; GCD; Linear Diophantine,Find Bezout coefficients using the extended Euclidean algorithm.
137,String Algorithms,KMP Pattern Matching,CodeChef,Medium,https://www.codechef.com/problems/KMPSTR,String Algorithms; KMP; Pattern Matching,Build the failure function and use it to skip unnecessary comparisons.
138,String Algorithms,Z-Algorithm Applications,CodeChef,Medium,https://www.codechef.com/problems/ZALGSTR,String Algorithms; Z-function,Compute the Z-array to find all occurrences of a pattern in a text.
139,String Algorithms,Rabin-Karp Rolling Hash,CodeChef,Medium,https://www.codechef.com/problems/RKSTR,String Algorithms; Hashing; Rolling Hash,Use polynomial rolling hash and slide the window to compare substrings in O(1).
140,String Algorithms,Repeated Substring Pattern,LeetCode,Easy,https://leetcode.com/problems/repeated-substring-pattern/,String Algorithms; KMP,Use KMP failure function - check if the string divides evenly by its period.
141,String Algorithms,Shortest Palindrome,LeetCode,Hard,https://leetcode.com/problems/shortest-palindrome/,String Algorithms; KMP; Palindrome,Apply KMP on (s + '#' + reverse(s)) to find the longest palindromic prefix.
142,String Algorithms,Longest Duplicate Substring,LeetCode,Hard,https://leetcode.com/problems/longest-duplicate-substring/,String Algorithms; Binary Search; Rabin-Karp,Binary search on length; use rolling hash to check for duplicates.
143,String Algorithms,String Matching in Array,LeetCode,Easy,https://leetcode.com/problems/string-matching-in-an-array/,String Algorithms; KMP; Strings,Check if each word is a substring of any longer word using KMP or contains().
144,Segment Trees / Fenwick Trees,Inversion Count using BIT,GeeksForGeeks,Medium,https://www.geeksforgeeks.org/problems/count-inversions/1,BIT; Fenwick Tree; Merge Sort,Coordinate compress then use BIT to count inversions in O(n log n).
145,Graphs,Alien Dictionary,LeetCode,Hard,https://leetcode.com/problems/alien-dictionary/,Graph; Topological Sort; Strings,Build a character dependency graph from adjacent words; topological sort gives the order.
146,Dynamic Programming,Regular Expression Matching,LeetCode,Hard,https://leetcode.com/problems/regular-expression-matching/,DP; 2D DP; Strings,dp[i][j] = whether pattern[0..j] matches string[0..i]; handle '*' carefully.
147,Graphs,Strongly Connected Components,Codeforces,Hard,https://codeforces.com/problemset/problem/427/C,Graph; Kosaraju; SCC; DFS,Two-pass DFS - first pass records finish times; second pass on reversed graph.
148,Dynamic Programming,Palindromic Substrings,LeetCode,Medium,https://leetcode.com/problems/palindromic-substrings/,DP; Strings; Expand Around Center,Expand around each center (single char and between chars) and count palindromes.
149,Graphs,Cheapest Flights Within K Stops,LeetCode,Medium,https://leetcode.com/problems/cheapest-flights-within-k-stops/,Graph; BFS; DP; Bellman-Ford,Run K+1 rounds of Bellman-Ford relaxation on edges.
150,Disjoint Set Union (Union-Find),Redundant Connection,LeetCode,Medium,https://leetcode.com/problems/redundant-connection/,DSU; Graph; Cycle Detection,Union-Find: the first edge whose endpoints are already in the same set is redundant.`;

type RawDsaProblem = Omit<DsaProblem, "priority">;

function toProblem(line: string): RawDsaProblem {
  const [id, topic, name, platform, difficulty, url, keyTags, ...hintParts] = line.split(",");

  return {
    id: Number(id),
    name: name.trim(),
    platform: platform.trim(),
    url: url.trim(),
    topic: topic.trim(),
    difficulty: difficulty.trim() as DsaDifficulty,
    tags: keyTags.split(";").map((tag) => tag.trim()).filter(Boolean),
    pattern: hintParts.join(",").trim(),
  };
}

const RAW_DSA_PROBLEMS = RAW_DSA_CSV.trim()
  .split(/\r?\n/)
  .slice(1)
  .map(toProblem);

const TOPIC_TOTALS = RAW_DSA_PROBLEMS.reduce((totals, problem) => {
  totals.set(problem.topic, (totals.get(problem.topic) ?? 0) + 1);
  return totals;
}, new Map<string, number>());

const topicOffsets = new Map<string, number>();

export const DSA_PROBLEMS: DsaProblem[] = RAW_DSA_PROBLEMS.map((problem) => {
  const indexWithinTopic = (topicOffsets.get(problem.topic) ?? 0) + 1;
  topicOffsets.set(problem.topic, indexWithinTopic);

  const topicAnchorBudget = Math.min(7, TOPIC_TOTALS.get(problem.topic) ?? 7);
  const priority: DsaPriority =
    problem.difficulty === "Easy" || indexWithinTopic <= topicAnchorBudget ? "MUST DO" : "HIGH";

  return {
    ...problem,
    priority,
  };
});

export const DSA_PROBLEM_MAP = new Map(DSA_PROBLEMS.map((problem) => [problem.id, problem]));

export const DSA_TOPIC_ORDER = Array.from(
  new Set(DSA_PROBLEMS.map((problem) => problem.topic)),
);

export const DSA_WEEK_THEMES: DsaWeekTheme[] = DSA_TOPIC_ORDER.map((topic, index) => ({
  week: index + 1,
  theme: topic,
  topics: [topic],
}));

export function getWeekForProblem(problem: DsaProblem) {
  const matched = DSA_WEEK_THEMES.find((week) => week.topics.includes(problem.topic));
  return matched?.week ?? DSA_WEEK_THEMES[DSA_WEEK_THEMES.length - 1].week;
}

export const DSA_WEEKLY_BUCKETS = DSA_WEEK_THEMES.map((week) => ({
  ...week,
  problems: DSA_PROBLEMS.filter((problem) => week.topics.includes(problem.topic)).sort((a, b) => {
    if (a.priority !== b.priority) {
      return a.priority === "MUST DO" ? -1 : 1;
    }

    return a.id - b.id;
  }),
}));
