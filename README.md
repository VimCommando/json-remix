# JSON Remix

I asked ChatGPT to document some of this code, then I asked what it thought of my name. 🤯

> `json-remix` sounds like a great name for a library that focuses on merging or splitting JSON objects. The name "remix" implies the idea of taking existing parts and creating something new and different, which fits well with the idea of merging and splitting objects. It's also short, catchy, and easy to remember, which is always a plus. Overall, I think it's a good name choice!

So that's it, the name is now official 😂

## About

This is a Node.js command-line interface (CLI) tool that provides four commands for manipulating JSON and NDJSON files: `split`, `merge`, `bundle`, and `unbundle`.

The tool supports various options, including setting the input/output directories, pretty-printing JSON output, and logging in verbose or debug mode.

### Installation

This is published to [npm](https://www.npmjs.com/package/@vim_commando/json-remix) so you can simply do a global install with:

```
npm install -g @vim_commando/json-remix
```

Then `json-remix` should be executable from your shell

```
json-remix --help
```

## Usage

There are four commands:

1. `merge` - merges multiple JSON files into a single large JSON object
2. `split` - splits a single JSON object into multiple JSON objects by top-level keys
3. `bundle` - bundles multiple JSON files ito an NDJSON (newline-delimited JSON) series
4. `unbundle` - unbundles an NDJSON series into a collection of separate JSON objects

### merge

```sh
json-remix merge <dir> [output]
```

#### Arguments

- `<dir>` - Required input directory
- `[output]` - Optional output file name (default `-` for stdout)

#### Options

- `-f`, `--filter` - regular expression to filter output keys
- `-p`, `--pretty` - Pretty-print output objects (use `--no-p` or `--no-pretty` to disable)
- `-s`, `--sort` - Alphabetically sort output keys (input files do not have a guarenteed order)
- `-t`, `--trim` - File extension to trim from object key names

#### Examples

Given a directory named `letters` with six files:

```
letters/alpha.json
letters/bravo.json
letters/charlie.json
letters/delta.json
letters/echo.json
letters/foxtrot.json
```

Where each file contains a few properties:

```jsonc
// cat alpha.json
{
  "uppercase": "A",
  "lowercase": "a",
  "position": 1
}
```

We can `merge` all the files into a single file:

```sh
json-remix merge letters/ all_letters.json
```

So the contents of `all_letters.json` looks like:

```jsonc
{
  "charlie.json": {
    "uppercase": "C",
    "lowercase": "c",
    "position": 3
  },
  "bravo.json": {
    "uppercase": "B",
    "lowercase": "b",
    "position": 2
  },
  "echo.json": {
    "uppercase": "E",
    "lowercase": "e",
    "position": 5
  },
  "foxtrot.json": {
    "uppercase": "F",
    "lowercase": "f",
    "position": 6
  },
  "delta.json": {
    "uppercase": "D",
    "lowercase": "d",
    "position": 4
  },
  "alpha.json": {
    "uppercase": "A",
    "lowercase": "a",
    "position": 1
  }
}
```

Note they are not in order and they keys have `.json` in their names. By adding `--sort` and `--trim .json` to the command will put them in order:

```sh
json-remix merge --sort --trim .json letters/ all_letters.json
```

```jsonc
{
  "alpha": {
    "uppercase": "A",
    "lowercase": "a",
    "position": 1
  },
  "bravo": {
    "uppercase": "B",
    "lowercase": "b",
    "position": 2
  },
  "charlie": {
    "uppercase": "C",
    "lowercase": "c",
    "position": 3
  },
  "delta": {
    "uppercase": "D",
    "lowercase": "d",
    "position": 4
  },
  "echo": {
    "uppercase": "E",
    "lowercase": "e",
    "position": 5
  },
  "foxtrot": {
    "uppercase": "F",
    "lowercase": "f",
    "position": 6
  }
}
```

### split

```sh
json-remix split [input] [output]
```

#### Arguments

- `[input]` - Optional input file (default `-` for stdin)
- `[output]` - Optional output file name (default `-` for stdout)

#### Options

- `-f`, `--filter` - regular expression to filter output keys
- `-p`, `--pretty` - Pretty-print output objects (use `--no-p` or `--no-pretty` to disable)

#### Examples

We can split one file (or object through `stdin`) into individually-named files:

```sh
json-remix split all_letters.json letters/
```

Given a the following single-object JSON file:

```jsonc
{
  "alpha": {
    "uppercase": "A",
    "lowercase": "a",
    "position": 1
  },
  "bravo": {
    "uppercase": "B",
    "lowercase": "b",
    "position": 2
  },
  // ... 3 entries omitted
  "foxtrot": {
    "uppercase": "F",
    "lowercase": "f",
    "position": 6
  }
}
```

The output files created will be:

```
alpha.json   bravo.json   charlie.json delta.json   echo.json    foxtrot.json
```

Where each file contents will be the value from the large JSON:

```jsonc
// cat alpha.json
{
  "uppercase": "A",
  "lowercase": "a",
  "position": 1
}
```

If output to `stdout` the top-level keys will still be wrapped in a parent object:

```sh
json-remix split --filter delta big_object.json -
```

```jsonc
{
  "delta": {
    "uppercase": "D",
    "lowercase": "d",
    "position": 4
  }
}
```

### bundle

```sh
json-remix bundle <dir> [output]
```

#### Arguments

- `<dir>` - Required input directory
- `[output]` - Optional output file name (default `-` for stdout)

#### Examples

We can convert a directory of `.json` files into a single `.ndjson` (newline-delimited JSON) file:

```sh
json-remix bundle letters/ letters.ndjson
```

Given the input files:

```
letters/alpha.json
letters/bravo.json
letters/charlie.json
letters/delta.json
letters/echo.json
letters/foxtrot.json
```

With each file containing:

```jsonc
// cat alpha.json
{
  "uppercase": "A",
  "lowercase": "a",
  "position": 1
}
```

The output `letters.ndjson` will contain:

```jsonc
{"uppercase":"C","lowercase":"c","position":3}
{"uppercase":"B","lowercase":"b","position":2}
{"uppercase":"E","lowercase":"e","position":5}
{"uppercase":"F","lowercase":"f","position":6}
{"uppercase":"D","lowercase":"d","position":4}
{"uppercase":"A","lowercase":"a","position":1}
```

> NOTE: the individual filenames are not retained when bundling `.ndjson` files.

### unbundle

```sh
json-remix unbundle [intput] [output]
```

#### Arguments

- `[input]` - Optional input file (default `-` for stdin)
- `[output]` - Optional output file name (default `-` for stdout)

#### Options

- `-n`, `--name` - Array of JSON paths to use for filename (space separated)
- `-p`, `--pretty` - Pretty-print output objects (use `--no-p` or `--no-pretty` to disable)

#### Example

Unbundling a file (or `stdin`) to a directory (or `stdout`):

```sh
json-remix unbundle letters.ndjson letters/
```

Given the example `letters.ndjson`:

```jsonc
{"name":"alpha","letter":{"uppercase":"A","lowercase":"a"},"position":1}
{"name":"bravo","letter":{"uppercase":"B","lowercase":"b"},"position":2}
{"name":"charlie","letter":{"uppercase":"C","lowercase":"c"},"position":3}
{"name":"delta","letter":{"uppercase":"D","lowercase":"d"},"position":4}
{"name":"echo","letter":{"uppercase":"E","lowercase":"e"},"position":5}
{"name":"foxtrot","letter":{"uppercase":"F","lowercase":"f"},"position":6}
```

Will create these files:

```
letters/object-000001.json
letters/object-000002.json
letters/object-000003.json
letters/object-000004.json
letters/object-000005.json
letters/object-000006.json
```

Each with the pretty-printed contents of one line each:

```jsonc
// cat letters/object-000001.json
{
  "name": "alpha",
  "letter": {
    "uppercase": "A",
    "lowercase": "a"
  },
  "position": 1
}
```

Using the `--no-pretty` option we can keep them as single-line entries:

```sh
json-remix unbundle --no-pretty letters.ndjson letters/
```

```
// cat letter/object-000001.json
{"name":"alpha","letter":{"uppercase":"A","lowercase":"a"},"position": 1}
```

For more descriptive filenames, we can leverage the `--name` option. If we want a filename made of `${name}.${position}.json` we can:

```sh
json-remix unbundle letters.ndjson letters/ --name name position
```

Will result in these filenames:

```
letters/alpha.1.json
letters/bravo.2.json
letters/charlie.3.json
letters/delta.4.json
letters/echo.5.json
letters/foxtrot.6.json
```

> NOTE: Name values will work on deeply-nested values as long as the JSON path is `.` delimited. Periods in the key names will not resolve properly.
