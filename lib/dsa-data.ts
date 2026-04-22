export type DsaPriority = "MUST DO" | "HIGH";

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
  priority: DsaPriority;
  pattern: string;
};

export type DsaWeekTheme = {
  week: number;
  theme: string;
  topics: string[];
};

const RAW_DSA_CSV = `ID,Problem,Platform,URL,Topic,Priority
1,Median of Two Sorted Arrays,LeetCode,https://leetcode.com/problems/median-of-two-sorted-arrays/,Binary Search,MUST DO
2,Longest Substring Without Repeating Characters,LeetCode,https://leetcode.com/problems/longest-substring-without-repeating-characters/,Sliding Window,MUST DO
3,Subarray Sum Equals K,LeetCode,https://leetcode.com/problems/subarray-sum-equals-k/,Prefix Sum,MUST DO
4,Maximum Subarray,LeetCode,https://leetcode.com/problems/maximum-subarray/,Kadane,HIGH
5,Product of Array Except Self,LeetCode,https://leetcode.com/problems/product-of-array-except-self/,Arrays,HIGH
6,Longest Consecutive Sequence,LeetCode,https://leetcode.com/problems/longest-consecutive-sequence/,Hashing,HIGH
7,Merge Intervals,LeetCode,https://leetcode.com/problems/merge-intervals/,Intervals,MUST DO
8,Insert Interval,LeetCode,https://leetcode.com/problems/insert-interval/,Intervals,HIGH
9,Sliding Window Maximum,LeetCode,https://leetcode.com/problems/sliding-window-maximum/,Deque,MUST DO
10,Trapping Rain Water,LeetCode,https://leetcode.com/problems/trapping-rain-water/,Stack,MUST DO
11,Largest Rectangle in Histogram,LeetCode,https://leetcode.com/problems/largest-rectangle-in-histogram/,Monotonic Stack,MUST DO
12,Next Greater Element II,LeetCode,https://leetcode.com/problems/next-greater-element-ii/,Stack,HIGH
13,Daily Temperatures,LeetCode,https://leetcode.com/problems/daily-temperatures/,Stack,HIGH
14,Valid Parentheses,LeetCode,https://leetcode.com/problems/valid-parentheses/,Stack,HIGH
15,LRU Cache,LeetCode,https://leetcode.com/problems/lru-cache/,Design,MUST DO
16,Reverse Nodes in k-Group,LeetCode,https://leetcode.com/problems/reverse-nodes-in-k-group/,Linked List,HIGH
17,Merge k Sorted Lists,LeetCode,https://leetcode.com/problems/merge-k-sorted-lists/,Heap,MUST DO
18,Linked List Cycle II,LeetCode,https://leetcode.com/problems/linked-list-cycle-ii/,Linked List,HIGH
19,Copy List with Random Pointer,LeetCode,https://leetcode.com/problems/copy-list-with-random-pointer/,Linked List,HIGH
20,Binary Tree Level Order Traversal,LeetCode,https://leetcode.com/problems/binary-tree-level-order-traversal/,Trees,HIGH
21,Binary Tree Maximum Path Sum,LeetCode,https://leetcode.com/problems/binary-tree-maximum-path-sum/,Trees,MUST DO
22,Lowest Common Ancestor of a Binary Tree,LeetCode,https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/,Trees,MUST DO
23,Serialize and Deserialize Binary Tree,LeetCode,https://leetcode.com/problems/serialize-and-deserialize-binary-tree/,Trees,HIGH
24,Validate Binary Search Tree,LeetCode,https://leetcode.com/problems/validate-binary-search-tree/,BST,HIGH
25,Kth Smallest Element in a BST,LeetCode,https://leetcode.com/problems/kth-smallest-element-in-a-bst/,BST,HIGH
26,Diameter of Binary Tree,LeetCode,https://leetcode.com/problems/diameter-of-binary-tree/,Trees,HIGH
27,Binary Tree Right Side View,LeetCode,https://leetcode.com/problems/binary-tree-right-side-view/,Trees,HIGH
28,Path Sum III,LeetCode,https://leetcode.com/problems/path-sum-iii/,Trees,MUST DO
29,Construct Binary Tree from Preorder and Inorder Traversal,LeetCode,https://leetcode.com/problems/construct-binary-tree-from-preorder-and-inorder-traversal/,Trees,HIGH
30,BST Iterator,LeetCode,https://leetcode.com/problems/binary-search-tree-iterator/,BST,HIGH
31,Number of Islands,LeetCode,https://leetcode.com/problems/number-of-islands/,Graphs,MUST DO
32,Rotting Oranges,LeetCode,https://leetcode.com/problems/rotting-oranges/,Graphs,HIGH
33,Pacific Atlantic Water Flow,LeetCode,https://leetcode.com/problems/pacific-atlantic-water-flow/,Graphs,HIGH
34,Clone Graph,LeetCode,https://leetcode.com/problems/clone-graph/,Graphs,HIGH
35,Network Delay Time,LeetCode,https://leetcode.com/problems/network-delay-time/,Dijkstra,MUST DO
36,Cheapest Flights Within K Stops,LeetCode,https://leetcode.com/problems/cheapest-flights-within-k-stops/,Graphs,HIGH
37,Course Schedule,LeetCode,https://leetcode.com/problems/course-schedule/,Topo Sort,MUST DO
38,Course Schedule II,LeetCode,https://leetcode.com/problems/course-schedule-ii/,Topo Sort,HIGH
39,Redundant Connection,LeetCode,https://leetcode.com/problems/redundant-connection/,DSU,HIGH
40,Number of Connected Components in an Undirected Graph,LeetCode,https://leetcode.com/problems/number-of-connected-components-in-an-undirected-graph/,DSU,HIGH
41,Accounts Merge,LeetCode,https://leetcode.com/problems/accounts-merge/,DSU,HIGH
42,Critical Connections in a Network,LeetCode,https://leetcode.com/problems/critical-connections-in-a-network/,Bridges,MUST DO
43,Is Graph Bipartite?,LeetCode,https://leetcode.com/problems/is-graph-bipartite/,Graphs,HIGH
44,Possible Bipartition,LeetCode,https://leetcode.com/problems/possible-bipartition/,Graphs,HIGH
45,House Robber,LeetCode,https://leetcode.com/problems/house-robber/,DP,MUST DO
46,House Robber II,LeetCode,https://leetcode.com/problems/house-robber-ii/,DP,HIGH
47,Coin Change,LeetCode,https://leetcode.com/problems/coin-change/,DP,MUST DO
48,Minimum Path Sum,LeetCode,https://leetcode.com/problems/minimum-path-sum/,DP,HIGH
49,Unique Paths,LeetCode,https://leetcode.com/problems/unique-paths/,DP,HIGH
50,Longest Increasing Subsequence,LeetCode,https://leetcode.com/problems/longest-increasing-subsequence/,DP,MUST DO
51,Longest Common Subsequence,LeetCode,https://leetcode.com/problems/longest-common-subsequence/,DP,MUST DO
52,Edit Distance,LeetCode,https://leetcode.com/problems/edit-distance/,DP,HIGH
53,Partition Equal Subset Sum,LeetCode,https://leetcode.com/problems/partition-equal-subset-sum/,DP,HIGH
54,Target Sum,LeetCode,https://leetcode.com/problems/target-sum/,DP,HIGH
55,Jump Game,LeetCode,https://leetcode.com/problems/jump-game/,Greedy,HIGH
56,Jump Game II,LeetCode,https://leetcode.com/problems/jump-game-ii/,Greedy,MUST DO
57,Gas Station,LeetCode,https://leetcode.com/problems/gas-station/,Greedy,MUST DO
58,Non-overlapping Intervals,LeetCode,https://leetcode.com/problems/non-overlapping-intervals/,Greedy,HIGH
59,Meeting Rooms II,LeetCode,https://leetcode.com/problems/meeting-rooms-ii/,Heap,HIGH
60,K Closest Points to Origin,LeetCode,https://leetcode.com/problems/k-closest-points-to-origin/,Heap,HIGH
61,Top K Frequent Elements,LeetCode,https://leetcode.com/problems/top-k-frequent-elements/,Heap,MUST DO
62,Find Median from Data Stream,LeetCode,https://leetcode.com/problems/find-median-from-data-stream/,Heap,MUST DO
63,Task Scheduler,LeetCode,https://leetcode.com/problems/task-scheduler/,Greedy,HIGH
64,Implement Trie (Prefix Tree),LeetCode,https://leetcode.com/problems/implement-trie-prefix-tree/,Trie,HIGH
65,Word Search II,LeetCode,https://leetcode.com/problems/word-search-ii/,Trie,MUST DO
66,Maximum XOR of Two Numbers in an Array,LeetCode,https://leetcode.com/problems/maximum-xor-of-two-numbers-in-an-array/,Trie,HIGH
67,Add and Search Word - Data structure design,LeetCode,https://leetcode.com/problems/design-add-and-search-words-data-structure/,Trie,HIGH
68,Repeated DNA Sequences,LeetCode,https://leetcode.com/problems/repeated-dna-sequences/,Strings,HIGH
69,Find All Anagrams in a String,LeetCode,https://leetcode.com/problems/find-all-anagrams-in-a-string/,Sliding Window,HIGH
70,Valid Anagram,LeetCode,https://leetcode.com/problems/valid-anagram/,Strings,HIGH
71,Palindrome Partitioning,LeetCode,https://leetcode.com/problems/palindrome-partitioning/,Backtracking,HIGH
72,Word Search,LeetCode,https://leetcode.com/problems/word-search/,Backtracking,MUST DO
73,Subsets,LeetCode,https://leetcode.com/problems/subsets/,Backtracking,HIGH
74,Permutations,LeetCode,https://leetcode.com/problems/permutations/,Backtracking,HIGH
75,N-Queens,LeetCode,https://leetcode.com/problems/n-queens/,Backtracking,MUST DO
76,Sudoku Solver,LeetCode,https://leetcode.com/problems/sudoku-solver/,Backtracking,MUST DO
77,Combination Sum,LeetCode,https://leetcode.com/problems/combination-sum/,Backtracking,HIGH
78,Subsets II,LeetCode,https://leetcode.com/problems/subsets-ii/,Backtracking,HIGH
79,Generate Parentheses,LeetCode,https://leetcode.com/problems/generate-parentheses/,Backtracking,HIGH
80,Decode Ways,LeetCode,https://leetcode.com/problems/decode-ways/,DP,HIGH
81,Climbing Stairs,LeetCode,https://leetcode.com/problems/climbing-stairs/,DP,HIGH
82,Maximum Product Subarray,LeetCode,https://leetcode.com/problems/maximum-product-subarray/,DP,HIGH
83,Best Time to Buy and Sell Stock,LeetCode,https://leetcode.com/problems/best-time-to-buy-and-sell-stock/,Arrays,HIGH
84,Best Time to Buy and Sell Stock II,LeetCode,https://leetcode.com/problems/best-time-to-buy-and-sell-stock-ii/,Greedy,HIGH
85,Maximum Sum Circular Subarray,LeetCode,https://leetcode.com/problems/maximum-sum-circular-subarray/,DP,HIGH
86,Find Minimum in Rotated Sorted Array,LeetCode,https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/,Binary Search,HIGH
87,Search in Rotated Sorted Array,LeetCode,https://leetcode.com/problems/search-in-rotated-sorted-array/,Binary Search,MUST DO
88,Search a 2D Matrix,LeetCode,https://leetcode.com/problems/search-a-2d-matrix/,Binary Search,HIGH
89,Kth Largest Element in an Array,LeetCode,https://leetcode.com/problems/kth-largest-element-in-an-array/,Heap,MUST DO
90,Merge Intervals,CodeChef,https://www.codechef.com/,Arrays,HIGH
91,Chef and Subarrays,CodeChef,https://www.codechef.com/,Arrays,HIGH
92,Interval Game,CodeChef,https://www.codechef.com/,Greedy,HIGH
93,Tree Queries,CodeChef,https://www.codechef.com/,Trees,HIGH
94,DISTINCT?,CodeChef,https://www.codechef.com/,Hashing,HIGH
95,DSA Learning Series: SUBINC,CodeChef,https://www.codechef.com/,DP,HIGH
96,Maximize It,CodeChef,https://www.codechef.com/,Greedy,HIGH
97,Chef and Array,CodeChef,https://www.codechef.com/,Arrays,HIGH
98,Little Elephant and Array,CodeChef,https://www.codechef.com/,Segment Tree,HIGH
99,Chef and Reversing,CodeChef,https://www.codechef.com/,Graphs,HIGH
100,Chef and Icecream,CodeChef,https://www.codechef.com/,Greedy,HIGH
101,Long Queue,CodeChef,https://www.codechef.com/,Queue,HIGH
102,Median,CodeChef,https://www.codechef.com/,Heap,HIGH
103,Prefix Sum Queries,CodeChef,https://www.codechef.com/,Segment Tree,HIGH
104,Chocolate Distribution,CodeChef,https://www.codechef.com/,Binary Search,HIGH
105,Codeforces Div2 C Problem Set,Codeforces,https://codeforces.com/problemset,Graphs,HIGH
106,Codeforces Div2 D Problem Set,Codeforces,https://codeforces.com/problemset,Data Structures,HIGH
107,Codeforces Div3 D Problem Set,Codeforces,https://codeforces.com/problemset,Greedy,HIGH
108,Codeforces Div3 E Problem Set,Codeforces,https://codeforces.com/problemset,DP,HIGH
109,Split Array Largest Sum,LeetCode,https://leetcode.com/problems/split-array-largest-sum/,Binary Search,MUST DO
110,Koko Eating Bananas,LeetCode,https://leetcode.com/problems/koko-eating-bananas/,Binary Search,HIGH
111,Aggressive Cows,GeeksforGeeks,https://www.geeksforgeeks.org/problems/aggressive-cows/1,Binary Search,MUST DO
112,Rod Cutting,GeeksforGeeks,https://www.geeksforgeeks.org/problems/rod-cutting0840/1,DP,HIGH
113,Matrix Chain Multiplication,GeeksforGeeks,https://www.geeksforgeeks.org/problems/matrix-chain-multiplication0303/1,DP,MUST DO
114,Burst Balloons,LeetCode,https://leetcode.com/problems/burst-balloons/,DP,MUST DO
115,Palindrome Partitioning II,LeetCode,https://leetcode.com/problems/palindrome-partitioning-ii/,DP,HIGH
116,Maximum Students Taking Exam,LeetCode,https://leetcode.com/problems/maximum-students-taking-exam/,Bitmask DP,HIGH
117,Shortest Path Visiting All Nodes,LeetCode,https://leetcode.com/problems/shortest-path-visiting-all-nodes/,Bitmask DP,MUST DO
118,Travelling Salesman Problem,GeeksforGeeks,https://www.geeksforgeeks.org/problems/travelling-salesman-problem/0,Bitmask DP,HIGH
119,DP on Trees (Subtree Queries),CodeChef,https://www.codechef.com/,DP on Trees,HIGH
120,Maximum XOR With an Element From Array,LeetCode,https://leetcode.com/problems/maximum-xor-with-an-element-from-array/,Trie,HIGH
121,Word Break II,LeetCode,https://leetcode.com/problems/word-break-ii/,DP,HIGH
122,Palindrome Pairs,LeetCode,https://leetcode.com/problems/palindrome-pairs/,Trie,HIGH
123,Implement Trie II,LeetCode,https://leetcode.com/problems/design-add-and-search-words-data-structure/,Trie,HIGH
124,Kth Smallest Number in Multiplication Table,LeetCode,https://leetcode.com/problems/kth-smallest-number-in-multiplication-table/,Binary Search,HIGH
125,Find Peak Element,LeetCode,https://leetcode.com/problems/find-peak-element/,Binary Search,HIGH
126,Search in a Sorted Array of Unknown Size,LeetCode,https://leetcode.com/problems/search-in-a-sorted-array-of-unknown-size/,Binary Search,HIGH
127,Min Cost to Connect All Points,LeetCode,https://leetcode.com/problems/min-cost-to-connect-all-points/,Graphs,HIGH
128,Pacific Atlantic Water Flow,LeetCode,https://leetcode.com/problems/pacific-atlantic-water-flow/,Graphs,HIGH
129,Alien Dictionary,LeetCode,https://leetcode.com/problems/alien-dictionary/,Topo Sort,MUST DO
130,Find Eventual Safe States,LeetCode,https://leetcode.com/problems/find-eventual-safe-states/,Graphs,HIGH
131,Strongly Connected Components,GeeksforGeeks,https://www.geeksforgeeks.org/problems/strongly-connected-components-kosarajus-algo/1,Graphs,HIGH
132,Articulation Points,GeeksforGeeks,https://www.geeksforgeeks.org/problems/articulation-point-1/1,Graphs,HIGH
133,Disjoint Set Union,CodeChef,https://www.codechef.com/,DSU,HIGH
134,Range Sum Query - Mutable,LeetCode,https://leetcode.com/problems/range-sum-query-mutable/,Segment Tree,MUST DO
135,Range Sum Query 2D - Mutable,LeetCode,https://leetcode.com/problems/range-sum-query-2d-mutable/,Segment Tree,HIGH
136,Count of Smaller Numbers After Self,LeetCode,https://leetcode.com/problems/count-of-smaller-numbers-after-self/,Segment Tree,MUST DO
137,Reverse Pairs,LeetCode,https://leetcode.com/problems/reverse-pairs/,Segment Tree,HIGH
138,My Calendar III,LeetCode,https://leetcode.com/problems/my-calendar-iii/,Segment Tree,HIGH
139,Maximum Frequency Stack,LeetCode,https://leetcode.com/problems/maximum-frequency-stack/,Heap,HIGH
140,Merge k Sorted Lists,CodeChef,https://www.codechef.com/,Heap,HIGH
141,Rearrange String k Distance Apart,LeetCode,https://leetcode.com/problems/rearrange-string-k-distance-apart/,Greedy,HIGH
142,Reorganize String,LeetCode,https://leetcode.com/problems/reorganize-string/,Greedy,HIGH
143,Implement Queue using Stacks,LeetCode,https://leetcode.com/problems/implement-queue-using-stacks/,Stack,HIGH
144,Design Circular Queue,LeetCode,https://leetcode.com/problems/design-circular-queue/,Queue,HIGH
145,Minimum Window Substring,LeetCode,https://leetcode.com/problems/minimum-window-substring/,Sliding Window,MUST DO
146,Longest Repeating Character Replacement,LeetCode,https://leetcode.com/problems/longest-repeating-character-replacement/,Sliding Window,HIGH
147,String Matching in an Array,LeetCode,https://leetcode.com/problems/string-matching-in-an-array/,Strings,HIGH
148,Substrings of Size Three with Distinct Characters,LeetCode,https://leetcode.com/problems/substrings-of-size-three-with-distinct-characters/,Sliding Window,HIGH
149,Rabin-Karp Pattern Search,GeeksforGeeks,https://www.geeksforgeeks.org/problems/rabin-karp-algorithm-problem/1,Strings,HIGH
150,Implement strStr(),LeetCode,https://leetcode.com/problems/find-the-index-of-the-first-occurrence-in-a-string/,Strings,HIGH
151,Count Palindromic Substrings,LeetCode,https://leetcode.com/problems/palindromic-substrings/,Strings,HIGH
152,Tree Diameter,CodeChef,https://www.codechef.com/,Trees,HIGH
153,Maximum Subarray Sum with One Deletion,LeetCode,https://leetcode.com/problems/maximum-subarray-sum-with-one-deletion/,DP,HIGH
154,Maximum Length of Pair Chain,LeetCode,https://leetcode.com/problems/maximum-length-of-pair-chain/,Greedy,HIGH
155,Smallest Range Covering Elements from K Lists,LeetCode,https://leetcode.com/problems/smallest-range-covering-elements-from-k-lists/,Heap,HIGH
156,Word Ladder,LeetCode,https://leetcode.com/problems/word-ladder/,Graphs,MUST DO
157,Word Ladder II,LeetCode,https://leetcode.com/problems/word-ladder-ii/,Graphs,HIGH
158,Number of Provinces,LeetCode,https://leetcode.com/problems/number-of-provinces/,Graphs,HIGH
159,Minimum Depth of Binary Tree,LeetCode,https://leetcode.com/problems/minimum-depth-of-binary-tree/,Trees,HIGH
160,Binary Tree Zigzag Level Order Traversal,LeetCode,https://leetcode.com/problems/binary-tree-zigzag-level-order-traversal/,Trees,HIGH
161,Construct Binary Search Tree from Preorder Traversal,LeetCode,https://leetcode.com/problems/construct-binary-search-tree-from-preorder-traversal/,BST,HIGH
162,Recover Binary Search Tree,LeetCode,https://leetcode.com/problems/recover-binary-search-tree/,BST,HIGH
163,Kth Largest Element in a Stream,LeetCode,https://leetcode.com/problems/kth-largest-element-in-a-stream/,Heap,HIGH
164,Topological Sort,CodeChef,https://www.codechef.com/,Graphs,HIGH
165,Lazy Propagation Segment Tree,GeeksforGeeks,https://www.geeksforgeeks.org/lazy-propagation-in-segment-tree/,Segment Tree,MUST DO
166,Minimum Cost of Ropes,GeeksforGeeks,https://www.geeksforgeeks.org/problems/minimum-cost-of-ropes-1587115620/1,Heap,HIGH
167,Connect N Ropes with Minimum Cost,CodeChef,https://www.codechef.com/,Heap,HIGH
168,Fractional Knapsack,GeeksforGeeks,https://www.geeksforgeeks.org/problems/fractional-knapsack-1587115620/1,Greedy,HIGH
169,Activity Selection,GeeksforGeeks,https://www.geeksforgeeks.org/problems/activity-selection-1587115621/1,Greedy,HIGH
170,Job Sequencing Problem,GeeksforGeeks,https://www.geeksforgeeks.org/problems/job-sequencing-problem-1587115620/1,Greedy,MUST DO
171,Minimum Number of Platforms,GeeksforGeeks,https://www.geeksforgeeks.org/problems/minimum-platforms-1587115620/1,Greedy,HIGH
172,Subarray with Given Sum,GeeksforGeeks,https://www.geeksforgeeks.org/problems/subarray-with-given-sum-1587115621/1,Sliding Window,HIGH
173,Longest Subarray with Sum K,GeeksforGeeks,https://www.geeksforgeeks.org/problems/longest-sub-array-with-sum-k0809/1,Prefix Sum,HIGH
174,Maximum Size Subarray Sum Equals k,LeetCode,https://leetcode.com/problems/maximum-size-subarray-sum-equals-k/,Prefix Sum,HIGH
175,0/1 Knapsack,GeeksforGeeks,https://www.geeksforgeeks.org/problems/0-1-knapsack-problem0945/1,DP,MUST DO
176,Unbounded Knapsack,GeeksforGeeks,https://www.geeksforgeeks.org/problems/knapsack-with-duplicate-items4201/1,DP,HIGH
177,Longest Palindromic Substring,LeetCode,https://leetcode.com/problems/longest-palindromic-substring/,Strings,HIGH
178,Count and Say,LeetCode,https://leetcode.com/problems/count-and-say/,Strings,HIGH
179,Remove Invalid Parentheses,LeetCode,https://leetcode.com/problems/remove-invalid-parentheses/,Backtracking,HIGH
180,Number of Ways to Wear Different Hats to Each Other,LeetCode,https://leetcode.com/problems/number-of-ways-to-wear-different-hats-to-each-other/,Bitmask DP,HIGH`;

const PATTERN_BY_TOPIC: Record<string, string> = {
  "Binary Search": "search on answer or partition boundary",
  "Sliding Window": "expand-shrink window with invariant tracking",
  "Prefix Sum": "prefix accumulation + hashmap lookup",
  Kadane: "track best ending here vs global best",
  Arrays: "index-driven invariant maintenance",
  Hashing: "set/map for O(1) membership and compression",
  Intervals: "sort by start and merge/greedy scan",
  Deque: "monotonic deque for window extrema",
  Stack: "use stack to maintain nearest valid boundary",
  "Monotonic Stack": "previous/next smaller or greater using monotonic stack",
  Design: "combine data structure primitives with O(1) operations",
  "Linked List": "pointer rewiring with dummy/head management",
  Heap: "min/max heap to keep top-k or streaming order",
  Queue: "FIFO invariant with circular or amortized implementation",
  Trees: "postorder/preorder DFS with subtree return values",
  BST: "inorder ordering + bounds-based validation",
  Graphs: "BFS/DFS over adjacency with visited state",
  Dijkstra: "priority queue shortest-path relaxation",
  "Topo Sort": "indegree or DFS finish-order graph ordering",
  DSU: "union-find with path compression and rank/size",
  Bridges: "Tarjan low-link discovery time logic",
  DP: "state transition over index, choice, or capacity",
  Greedy: "local best choice proved by invariant or exchange argument",
  Trie: "prefix tree traversal with pruning",
  Strings: "counting, matching, or center-expansion string invariant",
  Backtracking: "choose-explore-unchoose with pruning",
  "Segment Tree": "range query/update over tree of intervals",
  "Bitmask DP": "state compression over subsets and transitions",
  "DP on Trees": "merge child states into parent answer",
  "Data Structures": "maintain structure invariants under updates",
};

const PATTERN_BY_ID: Record<number, string> = {
  1: "binary search partition on the smaller array",
  2: "last seen index map to jump the left pointer",
  3: "prefix sum frequency map to count target hits",
  7: "sort then coalesce overlapping ranges",
  9: "deque stores useful indices in decreasing order",
  10: "two pointers track left/right max walls",
  11: "previous and next smaller boundaries define width",
  15: "hash map + doubly linked list for O(1) get/put",
  17: "merge heads through min-heap of list pointers",
  21: "drop negative branches in postorder DFS",
  22: "return node when left and right both report hit",
  28: "prefix sum on root-to-node paths",
  31: "grid flood fill with visited marking",
  35: "dijkstra with min-heap and stale-entry skip",
  37: "cycle detection through indegree depletion",
  42: "tarjan bridge detection with low-link values",
  45: "take or skip current house",
  47: "unbounded knapsack on amount",
  50: "patience sorting tails array",
  51: "2D DP on string prefixes",
  56: "level-based greedy jump expansion",
  57: "if total gas is negative impossible; otherwise reset on deficit",
  61: "bucket or heap on frequencies",
  62: "two heaps with balancing after every insertion",
  65: "trie + DFS board pruning",
  72: "DFS with backtracking and in-place visited marking",
  75: "column and diagonal occupancy pruning",
  76: "constraint propagation + backtracking",
  87: "binary search using sorted half property",
  89: "quickselect or fixed-size heap",
  109: "binary search answer with greedy partition count",
  111: "binary search answer on minimum distance",
  113: "interval DP over partition points",
  114: "burst last in interval DP",
  117: "BFS over node plus visited-mask state",
  129: "topological order from lexical precedence edges",
  134: "point update + range sum over segment tree",
  136: "count greater-right with compressed index tree",
  145: "need/formed window with exact shrink condition",
  156: "word graph BFS layer expansion",
  165: "push lazy tags before descending",
  170: "sort by profit and place in latest free slot",
  175: "0/1 capacity DP",
  180: "assign hats, not people, in bitmask DP",
};

export const DSA_WEEK_THEMES: DsaWeekTheme[] = [
  {
    week: 1,
    theme: "Linear Patterns",
    topics: ["Binary Search", "Sliding Window", "Prefix Sum", "Kadane", "Arrays", "Hashing", "Intervals"],
  },
  {
    week: 2,
    theme: "Core Data Structures",
    topics: ["Deque", "Stack", "Monotonic Stack", "Design", "Linked List", "Heap", "Queue", "Data Structures"],
  },
  {
    week: 3,
    theme: "Tree Thinking",
    topics: ["Trees", "BST"],
  },
  {
    week: 4,
    theme: "Graph Readiness",
    topics: ["Graphs", "Dijkstra", "Topo Sort", "DSU", "Bridges"],
  },
  {
    week: 5,
    theme: "Placement DP + Greedy Core",
    topics: ["DP", "Greedy", "DP on Trees"],
  },
  {
    week: 6,
    theme: "Advanced Search",
    topics: ["Trie", "Strings", "Backtracking", "Segment Tree", "Bitmask DP"],
  },
];

function toProblem(line: string): DsaProblem {
  const [id, name, platform, url, topic, priority] = line.split(",");
  return {
    id: Number(id),
    name,
    platform,
    url,
    topic,
    priority: priority as DsaPriority,
    pattern: PATTERN_BY_ID[Number(id)] || PATTERN_BY_TOPIC[topic] || "target the invariant first, then code",
  };
}

export const DSA_PROBLEMS: DsaProblem[] = RAW_DSA_CSV.trim()
  .split(/\r?\n/)
  .slice(1)
  .map(toProblem);

export const DSA_PROBLEM_MAP = new Map(DSA_PROBLEMS.map((problem) => [problem.id, problem]));

export const DSA_TOPIC_ORDER = Array.from(
  new Set(DSA_PROBLEMS.map((problem) => problem.topic)),
);

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
