# JSON Remix

I asked ChatGPT to document some of this code, then I asked what it thought of my name. 🤯

> `json-remix` sounds like a great name for a library that focuses on merging or splitting JSON objects. The name "remix" implies the idea of taking existing parts and creating something new and different, which fits well with the idea of merging and splitting objects. It's also short, catchy, and easy to remember, which is always a plus. Overall, I think it's a good name choice!

So that's it, the name is now official 😂

## About

This is a Node.js command-line interface (CLI) tool that provides four commands for manipulating JSON files: `split`, `merge`, `bundle`, and `unbundle`.

The `split` command splits a single-object JSON file into multiple JSON files based on the keys of the object. The output files are named ${key}.json, and can be optionally filtered by a regular expression.

The `merge` command merges multiple single-object JSON files into a single JSON file, where each object is a property of the output object. The output filename can be specified, and object keys can be trimmed and sorted alphabetically.

The `bundle` command bundles multiple JSON files into a single NDJSON file (newline-delimited JSON), and the `unbundle` command does the opposite by extracting JSON objects from an NDJSON file and writing them to individual JSON files.

The tool supports various options, including setting the input/output directories, pretty-printing JSON output, and logging in verbose or debug mode.

