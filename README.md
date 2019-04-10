# Configuration language for Choroscope

This repository defines the configuration language for the geospatial data visualization platform Choroscope.

## Themes

In Choroscope, a data set and the instructions for visualizing that data set are called, collectively, a "theme." The raw materials for a Choroscope theme include:
- files containing the data to be visualized (CSVs and/or GeoTIFFs)
- files defining the geometry of geographical features used in the visualization (shapefiles)
- a configuration file, conforming to the rules of this specification, that describes the shape of the data and how it should be visualized (`config.json`)

The configuration language is based on JSON (JavaScript Object Notation), and the configuration file for a theme must be a JSON file. The specification itself, however, which is defined in the file `config.spec.d.ts`, is written in TypeScript. TypeScript provides a comprehensive type system for JavaScript (upon which JSON is based) that allows us to describe in code many of the details of the configuration language, and the TypeScript compiler simplifies the process of validating Choroscope config files. For more information about TypeScript, consult the [docs](http://www.typescriptlang.org/docs/home.html).

## Configuration

The `Config` type represents the JSON configuration object as a whole. When browsing the specification for the first time, we recommend you start there before working your way deeper into the hierarchy. The most important properties of the `Config` object include:
- `name`: the name of the theme as represented internally
- `display_name`: the name of the theme as it will appear to a user of the application
- `dimensions`: defines the dimensions of your data set; these are the raw materials for describing the shape (or shapes) or your data
- `schemas`: defines the shape (or shapes) of your data set, using the `dimensions`
- `color_scales`: defines how to colorize features on the map according to the associated values from your data

## Multiple data shapes: defining conditions and metadimensions

Choroscope supports multiple independent data shapes ("schemas") within the same theme. To allow a user to navigate between schemas, you'll need to define one or more dimensions specifically for this purpose. Such "metadimensions" don't describe the shape of any one schema. Instead, they're higher-level abstractions used to join your schemas together into a single conceptual decision tree. This tree is what enables the application to determine what to display given any possible combination of dimension options the user may select.

For example, let's say we're defining a theme to visualize education data by location. We'd like this theme to show both:
1. average education (in years), broken down by sex and age group
2. the difference in education (in years) between men and women, broken down by age group

This will require defining two schemas. For average education, we'll need two dimensions, sex and age group. For sex difference in education, however, we'll only need one dimension, age group. Because this latter data set already represents a comparison by sex, it would make no sense to break down the data further by sex. Our dimensions, then, might be defined as follows:

```json
[
  { "name": "age", "display_name": "Age group", "options": ["15-49", "20-24"] },
  { "name": "sex", "display_name": "Sex", "options": ["male", "female"] }
]
```

And our schemas could be defined like this:

```json
[
  { "name": "avg_edu", "dimensions": ["age", "sex"], ... },
  { "name": "diff", "dimensions": ["age"], ... }
]
```

There are a few things to note here:
- In the schema definitions, we refer to the dimensions we defined earlier by their "name" property.
- The "age" dimension can be defined once and used in both schemas, since its options are identical in both data sets. If, on the other hand, we needed different age groups in each schema, we'd need to define two separate age group dimensions, one for each schema, and give them distinct names (e.g. "age_avg_edu" and "age_diff") to distinguish one from the other.

At this point we've defined the shapes of both schemas and the dimensions needed to describe them, but the application doesn't yet have a way to let a user navigate between them. We still need a dimension for selecting between schemas and conditions to describe when each schema is active. Let's add a metadimension, which we'll call "measure":

```json
[
  {
    "name": "measure",
    "display_name": "Measure",
    "options": [
      { "name": "avg_edu", "display_name": "Average education" },
      { "name": "diff", "display_name": "Sex difference in education" }
    ]
  },
  { "name": "age", "display_name": "Age group", "options": ["15-49", "20-24"] },
  { "name": "sex", "display_name": "Sex", "options": ["male", "female"] }
]
```

Observations:
- "measure" defines two options, one for each schema. We've named these options identically to the schemas they're used to select. This is not strictly required, but it helps to make the purpose of "measure" easier to understand.
- We've used the longer, more verbose format for defining the options (type `Option` in the specification). This allows us to specify the (unique) internal name and the name used for display separately.
- Notice that there's no difference in the definition of a metadimension versus an ordinary definition. We used the longer form of `Option` in defining "measure", but we could have done that for the other dimensions as well. What distinguishes a metadimension is its usage in the schemas' "conditions" property.

Now let's add conditions to each schema definition:

```json
[
  {
    "name": "avg_edu",
    "dimensions": ["age", "sex"],
    "conditions": { "measure": ["avg_edu"] },
    ...
  },
  {
    "name": "diff",
    "dimensions": ["age"],
    "conditions": { "measure": ["diff"] },
    ...
  }
]
```

This tells the application that if the user has selected "Average education" for the "measure" dimension, it should consider the "avg_edu" schema to be active. It will therefore visualize data from this schema and display UI selectors for the "age" and "sex" dimensions so that the user can navigate within the schema. If, on the other hand, the user selects "Sex difference in education", the application will make the "diff" schema active. Because this schema only defines one dimension, age group, the UI selector for "sex" will disappear.

This is quite a simple example, but more complicated structures can be defined as well. Note that:
- It's possible to define multiple metadimensions. This is sometimes useful for creating logical hierarchies.
- Each schema can define multiple conditions; indeed this is required if multiple metadimensions are used. We can specify additional conditions simply by adding more keys (referencing other metadimensions) to the `Conditions` object, e.g.: `{ "measure": ["avg_edu"], "another_dimension": ["some_option"] }`.
- Each condition can be satisfied by multiple options from the dimension in question. We specify this by adding additional options to the array in the `Conditions` object, e.g.: `{ "measure": ["avg_edu", "another_option"] }`.

## Color scale conditions

The same "conditions" semantics are used for specifying when a given color scale should be active. Often there's a one-to-one correspondence between a given schema and a color scale used to visualize it. This is not a requirement, though. Technically, color scale conditions are fully independent from schema conditions.
