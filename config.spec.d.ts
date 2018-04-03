/**
 * the JSON configuration object as a whole
 */
type Config = {

  // the name used internally as a unique identifier for the current theme;
  // must be unique; should ideally be as short as possible without being cryptic
  "name": string,

  // the name of the theme as displayed to the user
  "display_name": string,

  "data_format"?: {
    // Enable visualization of raster data?
    "raster"?: boolean,    // default: true
    // Enable visualization of aggregate data?
    "aggregate"?: boolean, // default: true
    // Low-level representation of data values. This MUST correspond to the pixel type of the raster
    // files, if any. (The mask, however, may have any pixel type, though 'Byte' is recommended.)
    "data_type"?: DataType, // default: "Float64"
    // numeric value in TIFF files that indicates the absence of data for a given pixel
    "no_data_value"?: number, // default: -1.7e+308
  },

  // the URL from which a user may download the source data files
  "download_url"?: string,

  /**
   * relative path to the TIFF file to be applied as mask to each TIFF data file
   * example: "data/raster/mask.tiff"
   *
   * The process of masking compares each data file, pixel by pixel, to the mask. If the mask
   * contains a "no data" value for a given pixel, the corresponding pixel in the output raster will
   * also have a "no data" value. Otherwise it will have the value from the corresponding pixel in
   * the data file.
   *
   * This property is required if data_format.raster is `true`.
   */
  "filepath_raster_mask"?: string,

  // configuration pertaining to shapefiles used to draw political units on the map
  "shapefiles": {
    /**
     * whitelist of location_ids used to filter the shapefiles
     * We include only these admin0 locations and only admin1 and admin2 locations that are their
     * descendants.
     */
    "admin0_locations": number[],
  },

  // tile server URL for the basemap that will be displayed UNDER the data layer
  // default: "https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_nolabels/{z}/{x}/{y}.png"
  "basemap_url"?: string,

  // tile server URL for the basemap that will be displayed ON TOP OF the data layer (usu. labels)
  // default: "https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_only_labels/{z}/{x}/{y}.png"
  "basemap_labels_url"?: string,

  // array of data dimensions used in the visualization (defined below)
  "dimensions": Dimension[],

  // array of distinct data shapes used in the visualization (defined below)
  "schemas": Schema[],

  // array of color scales used to colorize the data displayed on the map (defined below)
  "color_scales": ColorScale[],
};

/**
 * corresponds to the identically-named pixel types in GDAL
 * See the table below for correspondence with Postgres/PostGIS types.
 */
type DataType =
  // GDAL type | PostGIS pixel type | Postgres type for aggregate data
  // -----------------------------------------------------------------
  // Byte      | 8BSI               | smallint
  | "Byte"

  // Int16     | 16BSI              | smallint
  | "Int16"

  // UInt16    | 16BUI              | smallint
  | "UInt16"

  // Int32     | 32BSI              | integer
  | "Int32"

  // UInt32    | 32BUI              | integer
  | "UInt32"

  // Float32   | 32BF               | real
  | "Float32"

  // Float64   | 64BF               | double precision
  | "Float64"
  ;

/**
 * data dimension defined within the "dimensions" property of `Config`, above
 *
 * Dimensions are only meaningful within the context of a `Schema`, or data shape. A dimension
 * defined here that is not referenced in any schema will not be used in the tool. We define
 * dimensions separately from schemas so that the same dimension may be used in multiple schemas
 * without having to be defined multiple times.
 */
type Dimension = {

  // the name used internally as a unique identifier for the dimension;
  // must be unique; should ideally be as short as possible without being cryptic
  "name": string,

  // the name of the dimension as displayed to the user
  "display_name": string,

  // array of possible values for the dimension (defined below)
  "options": Option[],

  // option to display by default when the tool starts
  "default_option"?: string | number, // default: the first element in the "options" array

  // type of control widget the user will use to set the dimension
  // default: "select"
  "widget_type"?:
    // a text selection box that displays the current option and expands to a scrollable list of
    // all options when clicked
    | "select"
    // a draggable horizontal slider
    | "slider"
    // a group of buttons, one for each option; one and only one button may be selected at a time
    | "buttonset",

  /**
   * Enable the playback feature for this dimension?
   * If enabled, we render a play button next to the dimension control. Pressing play begins a timed
   * sequence of state changes in which we step through the array of options for this dimension.
   */
  "playable"?: boolean, // default: false

  // tooltip text to explain the meaning of the dimension to the user
  "help_text"?: string,
};

/**
 * option defined within the "options" property of a `Dimension` object, above
 *
 * "name" is a unique identifier (unique for the current dimension, that is) used to represent the
 * option internally in the program and in the config file. "display_name" is the name shown to the
 * user.
 *
 * If an option is specified simply as a number or string, that value will be used as both "name"
 * and "display_name".
 */
type Option =
  | string
  | number
  | {
    "name": string,
    "display_name": string,
  };

/**
 * data shape defined within the "schemas" property of `Config`, above, and referencing dimensions
 * defined within the "dimensions" property of `Config`
 *
 * The application supports multiple data shapes for a given theme. While the application is
 * running, one (and only one) schema may be active at a given time. We specify when a schema is
 * active with the "conditions" property. Essentially, one or more dimensions serve as schema
 * selectors. That is, when a user changes the value of such a dimension, he/she may change the
 * active schema. In the database, each schema is represented by a separate set of data tables.
 */
type Schema = {

  // unique name for the schema, used internally;
  // should ideally be as short as possible without being cryptic
  "name": string,

  // a `Conditions` object (defined below) specifying when this schema will be active
  // If no conditions are specified, the schema will always be active.
  "conditions"?: Conditions,

  /**
   * data dimensions defined for this schema
   * (not including schema-selector dimensions specified in "conditions");
   * an array of strings referencing the "name" property of `Dimension` objects defined in the
   * "dimensions" property of the `Config` object
   */
  "dimensions": string[],

  /**
   * template representing a relative path to the raster files (TIFF) for this schema
   *
   * There must be one file for every combination of options of the dimensions defined within the
   * "dimensions" property. The template should contain a "wildcard" for each such dimension (i.e.
   * the name of the dimension enclosed in curly braces. When searching for files, the program will
   * substitute for each such wildcard the "name" property of each option defined for that
   * dimension. It's recommended to use some delimiting character, like _, between wildcards.
   *
   * EXAMPLE:
   *
   * dimensions: [
   *   { "name": "dim1", "options": ["opt-1a", "opt-1b"], ... },
   *   { "name": "dim2", "options": ["opt-2a", "opt-2b"], ... }
   * ]
   * raster template: "data/raster/{dim1}_{dim2}.tif"
   * corresponding files:
   * - data/raster/opt-1a_opt-2a.tif
   * - data/raster/opt-1a_opt-2b.tif
   * - data/raster/opt-1b_opt-2a.tif
   * - data/raster/opt-1b_opt-2b.tif
   */
  "filepath_template_raster"?: string,

  // template representing a relative path to the aggregate data files (CSV) for this schema;
  // the same guidelines apply as for "filepath_template_raster" above
  "filepath_template_aggregate"?: string,

  /**
   * template representing the title text to display to the user when this schema is active
   * may optionally contain wildcards that reference dimension names; in that case the wildcard
   * will be replaced with the "display_name" property of the current option selected for the
   * given dimension
   *
   * EXAMPLE:
   *
   * dimensions: [
   *   { "name": "age", "options": ["children", "adults"], ... },
   *   { "name": "year", "options": [2000, 2010], ... }
   * ]
   * template: "Mortality for {age} in {year}"
   * selected options: { "age": "children", "year": 2010 }
   * rendered title: "Mortality for children in 2010"
   */
  "ui_title_template": string,

  // `InfoDisplay` configurations (defined below) for this schema
  "info_displays"?: InfoDisplay[],
};

/**
 * configuration object for an info display component
 *
 * In addition to visualizing data on the map, the application also provides an "Info" box for
 * showing supplemental data about the selected pixel (in "geospatial" mode) or geographic feature
 * (in "aggregate" mode). This Info Box can render one or more display components, defined by the
 * configuration object(s) provided.
 */
type InfoDisplay =
  | LineChart
  | ValuesDisplay
  ;

/**
 * configuration object for the LineChart display component
 */
type LineChart = {
  "type": "line_chart",

  // dimension to show as domain of chart
  "domain": string,

  // configuration for one or more lines (or areas) to display on the chart, defined below
  // If none specified, we show a line representing the values for the current data dimension
  // selections for each option of the "domain" dimension.
  "lines"?: LineConfig[],
};

/**
 * configuration object for a line and/or area to display on a line chart
 */
type LineConfig = {

  /**
   * Show the value not just for the currently selected option but for multiple options of the given
   * dimension (references the dimension's "name" property).
   */
  "expand_dimension": string,

  /**
   * option from the "expand_dimension" for which the application should render a line
   */
  "line"?: string | number,

  /**
   * options from the "expand_dimension" for which the application should render a shaded area.
   * To be more precise, we draw two lines, one for "upper" and one for "lower", and we shade the
   * area in between. This is useful for showing a range or interval, like a statistical uncertainty
   * interval.
   * NB: It is an error to define only one of these properties; if one is specified, both must be
   * specified.
   */
  "upper"?: string | number,
  "lower"?: string | number,
};

/**
 * configuration object for the Values display component
 *
 * Values is a very simple component. It just displays numeric data values for the currently
 * selected pixel/feature and the corresponding color based on the current `ColorScale`.
 */
type ValuesDisplay = {
  "type": "values",

  /**
   * show the value not just for the currently selected option but for ALL options of the given
   * dimension (references the dimension's "name" property)
   */
  "expand_dimension"?: string,

  // round to this many places after the decimal point
  "precision"?: number, // default: no rounding
};

/**
 * color scale defined within the "color_scales" property of `Config`, above
 *
 * The application can colorize the data displayed on the map using a variety of "color scales"
 * for a given theme. Each scale specifies a list of reference colors and the data values to which
 * those colors should be applied. Values in between reference values will be colorized with an
 * interpolated color.
 *
 * As with schemas, one (and only one) color scale may be active at a given time. We specify when a
 * color scale is active with the "conditions" property.
 */
type ColorScale = {

  // a `Conditions` object (defined below) specifying when this color scale will be active
  // If no conditions are specified, the color scale will always be active.
  "conditions"?: Conditions,

  // text to display on the color scale legend when this color scale is active
  "legend_label": string,

  // NOT YET SUPPORTED
  // In a "dynamic" color scale, color offset values represent not precise data values but fractions
  // (in the range 0.0 - 1.0) of a reference extent. The reference extent corresponds to the
  // extent of data values (min. to max.) of the currently selected location for the currently
  // selected data dimensions.
  "dynamic"?: boolean, // default: false

  // array of `ColorStop` objects that comprise the scale (defined below), ordered from smallest to
  // largest `offset` values.
  "scale": ColorStop[],

  // array of `SentinelValue` objects that comprise individual non-numeric values depicted by their
  // associated `label`.
  "sentinel_values"?: SentinelValue[],
};

/**
 * object defined within the "scale" property of `ColorScale` (above) describing how to colorize a
 * specified data value
 */
type ColorStop = {

  /**
   * string representation of a color, in a format compatible with both
   * CartoCSS (https://carto.com/docs/carto-engine/cartocss/properties/#color)
   * and d3-scale (https://github.com/d3/d3-scale#continuous_interpolate)
   * e.g.: hex codes, rgb, rgba, hsl, hsla, and HTML color names
   */
  "color": string,

  /**
   * value at which the specified color will be applied
   * If the color scale is dynamic, offset will be in the range 0-1; otherwise it will correspond
   * to a literal data value.
   */

  "offset": number,

  // optional label to show for this color stop on the color scale legend
  "label"?: string,
};

interface SentinelValue extends ColorStop {
  // Label to show in relation to the color in the SentinelValue Legend.
  "label": string;
}

/**
 * mapping from dimension "name" to an array of option "name"s
 * used in both `Schema` and `ColorScale` to determine when the schema/color-scale is active
 *
 * The condition is satisfied if for each dimension specified the current option is among those
 * listed.
 *
 * EXAMPLE:
 *
 * dimensions: [
 *   { "name": "data-shape", "options": ["data-shape-1", "data-shape-2"], ... },
 *   ...
 * ]
 * conditions: { "data-shape": ["data-shape-1"] }
 * ACTIVE if "data-shape" is "data-shape-1"
 * INACTIVE otherwise
 */
type Conditions = {
  [dimensionName: string]: Array<string | number>,
};
