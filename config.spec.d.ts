/**
 * the JSON configuration object as a whole
 */
export interface Config {

  /**
   * the name used internally as a unique identifier for the current theme;
   * must be unique; should ideally be as short as possible without being cryptic
   */
  "name": string;

  /**
   * the name of the theme as displayed to the user
   */
  "display_name": string;

  /**
   * details of the data representation
   */
  "data_format"?: DataFormat;

  /**
   * default settings to show when the theme is first loading in the application
   */
  "default_display"?: DefaultDisplay;

  /**
   * the URL from which a user may download the source data files
   */
  "download_url"?: string;

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
  "filepath_raster_mask"?: string;

  "shapefiles": Shapefiles;

  /**
   * tile server URL for the basemap that will be displayed UNDER the data layer
   * default: "https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_nolabels/{z}/{x}/{y}.png"
   */
  "basemap_url"?: string;

  /**
   * tile server URL for the basemap that will be displayed ON TOP OF the data layer (usu. labels)
   * default: "https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_only_labels/{z}/{x}/{y}.png"
   */
  "basemap_labels_url"?: string;

  /**
   * array of data dimensions used in the visualization (defined below)
   */
  "dimensions": Dimension[];

  /**
   * array of distinct data shapes used in the visualization (defined below)
   */
  "schemas": Schema[];

  /**
   * array of color scales used to colorize the data displayed on the map (defined below)
   */
  "color_scales": ColorScale[];
}

export interface DataFormat {
  /**
   * Enable visualization of raster data? default: true
   */
  "raster"?: boolean;

  /**
   * Enable visualization of aggregate data? default: true
   */
  "aggregate"?: boolean;

  /**
   * Low-level representation of data values. This MUST correspond to the pixel type of the raster
   * files, if any. (The mask, however, may have any pixel type, though 'Byte' is recommended.)
   * If value is of type DataType, it applies to all data, raster and aggregate alike.
   * If different types are needed for aggregate versus raster data, use DataTypeConfig instead.
   * default: "Float64"
   */
  "data_type"?: DataType | DataTypeConfig;

  /**
   * numeric value in TIFF files that indicates the absence of data for a given pixel
   * default: -1.7e+308
   */
  "no_data_value"?: number;

  /**
   * zoom level represented by the source raster images, based on standard Google-style map tiling:
   * http://www.maptiler.org/google-maps-coordinates-tile-bounds-projection/)
   * default: 5
   */
  "native_zoom"?: number;

  /**
   * maximum (i.e. most detailed) admin level available. default: 2
   */
  "max_admin_level"?: 0 | 1 | 2;
}

export interface DefaultDisplay {
  /**
   * display mode to show when the theme is first loaded; default: aggregate
   */
  "mode"?: "geo" | "aggregate";

  /**
   * detail level to show when the theme is first loaded; default: 1
   */
  "level"?: 0 | 1 | 2;
}

/**
 * configuration pertaining to shapefiles used to draw political units on the map
 */
export interface Shapefiles {
  /**
   * whitelist of location_ids used to filter the shapefiles
   * We include only these admin0 locations and only admin1 and admin2 locations that are their
   * descendants.
   */
  "admin0_locations": number[];

  /**
   * list of location_ids for locations with no descendants
   * Note that it's not necessary to list IDs for locations at the max admin level. We assume those
   * locations have no descendants. Instead, this list is used to specify deviations from the norm,
   * that is, branches of the location hierarchy that do not extend all the way down to the max
   * admin level.
   */
  "no_descendants"?: number[];

  /**
   * list of location_ids for which no raster data is available
   */
  "exclude_raster"?: number[];

  /**
   * list of location_ids for which no aggregate data is available
   */
  "exclude_aggregate"?: number[];
}

/**
 * corresponds to the identically-named pixel types in GDAL
 * See the table below for correspondence with Postgres/PostGIS types.
 */
export type DataType =
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
 * alternative to specifying DataType directly; allows different types for raster versus aggregate
 */
export interface DataTypeConfig {
  "raster": DataType;
  "aggregate": DataType;
}

/**
 * data dimension defined within the "dimensions" property of `Config`, above
 *
 * Dimensions are only meaningful within the context of a `Schema`, or data shape. A dimension
 * defined here that is not referenced in any schema will not be used in the tool. We define
 * dimensions separately from schemas so that the same dimension may be used in multiple schemas
 * without having to be defined multiple times.
 */
export interface Dimension {
  /**
   * the name used internally as a unique identifier for the dimension;
   * must be unique; should ideally be as short as possible without being cryptic
   */
  "name": string;

  /**
   * the name of the dimension as displayed to the user
   */
  "display_name": string;

  /**
   * array of possible values for the dimension (defined below)
   */
  "options": Option[];

  /**
   * option to display by default when the tool starts
   * default: the first element in the "options" array
   */
  "default_option"?: string | number;

  /**
   * type of control widget the user will use to set the dimension
   * default: "select"
   */
  "widget_type"?:
    /**
     * a text selection box that displays the current option and expands to a scrollable list of
     * all options when clicked
     */
    | "select"
    /**
     * a draggable horizontal slider
     */
    | "slider"
    /**
     * a group of buttons, one for each option; one and only one button may be selected at a time
     */
    | "buttonset";

  /**
   * Enable the playback feature for this dimension?
   * If enabled, we render a play button next to the dimension control. Pressing play begins a timed
   * sequence of state changes in which we step through the array of options for this dimension.
   * default: false
   */
  "playable"?: boolean;

  /**
   * tooltip text to explain the meaning of the dimension to the user
   */
  "help_text"?: string;
}

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
export type Option =
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
export interface Schema {
  /**
   * unique name for the schema, used internally;
   * should ideally be as short as possible without being cryptic
   */
  "name": string;

  /**
   * a `Conditions` object (defined below) specifying when this schema will be active
   * If no conditions are specified, the schema will always be active.
   */
  "conditions"?: Conditions;

  /**
   * data dimensions defined for this schema
   * (not including schema-selector dimensions specified in "conditions");
   * an array of strings referencing the "name" property of `Dimension` objects defined in the
   * "dimensions" property of the `Config` object
   */
  "dimensions"?: string[];

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
  "filepath_template_raster"?: string;

  /**
   * template representing a relative path to the aggregate data files (CSV) for this schema;
   * the same guidelines apply as for "filepath_template_raster" above
   */
  "filepath_template_aggregate"?: string;

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
  "ui_title_template": string;

  /**
   * `InfoDisplay` configurations (defined below) for this schema
   */
  "info_displays"?: InfoDisplay[];

  /**
   * When displaying data values, round to this many places after the decimal point.
   * (default: no rounding)
   */
  "display_precision"?: number;
}

/**
 * configuration object for an info display component
 *
 * In addition to visualizing data on the map, the application also provides an "Info" box for
 * showing supplemental data about the selected pixel (in "geospatial" mode) or geographic feature
 * (in "aggregate" mode). This Info Box can render one or more display components, defined by the
 * configuration object(s) provided.
 */
export type InfoDisplay =
  | BarChart
  | LineChart
  | ValuesDisplay
  ;

/**
 * configuration object for the BarChart display component
 */
export interface BarChart {
  "type": "bar_chart";

  /**
   * dimension whose options comprise the categories
   * In a normal bar chart, each category is represented by a single bar.
   * In a stacked bar chart, each category is represented by a stack.
   */
  "category_dimension": string;

  /**
   * only used for stacked bar chart: the dimension whose options comprise the layers
   */
  "subcategory_dimension"?: string;
}

/**
 * configuration object for the LineChart display component
 */
export interface LineChart {
  "type": "line_chart";

  /**
   * dimension to show as domain of chart
   */
  "domain": string;

  /**
   * configuration for one or more lines (or areas) to display on the chart, defined below
   * If none specified, we show a line representing the values for the current data dimension
   * selections for each option of the "domain" dimension.
   */
  "lines"?: LineConfig[];
}

/**
 * configuration object for a line and/or area to display on a line chart
 */
export interface LineConfig {
  /**
   * Show the value not just for the currently selected option but for multiple options of the given
   * dimension (references the dimension's "name" property).
   */
  "expand_dimension": string;

  /**
   * option from the "expand_dimension" for which the application should render a line
   */
  "line"?: string | number;

  /**
   * options from the "expand_dimension" for which the application should render a shaded area.
   * To be more precise, we draw two lines, one for "upper" and one for "lower", and we shade the
   * area in between. This is useful for showing a range or interval, like a statistical uncertainty
   * interval.
   * NB: It is an error to define only one of these properties; if one is specified, both must be
   * specified.
   */
  "upper"?: string | number;
  "lower"?: string | number;
}

/**
 * configuration object for the Values display component
 *
 * Values is a very simple component. It just displays numeric data values for the currently
 * selected pixel/feature and the corresponding color based on the current `ColorScale`.
 */
export interface ValuesDisplay {
  "type": "values";

  /**
   * show the value not just for the currently selected option but for ALL options of the given
   * dimension (references the dimension's "name" property)
   */
  "expand_dimension"?: string;

  /**
   * DEPRECATED: use `Schema.display_precision` instead
   * round to this many places after the decimal point
   * default: no rounding
   */
  "precision"?: number;
}

/**
 * color scale defined within the "color_scales" property of `Config`, above
 *
 * The application can colorize the data displayed on the map using a variety of "color scales"
 * for a given theme. Each scale specifies a list of reference colors and the data values to which
 * those colors should be applied. Values in between reference values will be colorized with an
 * interpolated color.
 *
 * It's also possible to specify one or more fixed values, i.e. "sentinel values". If a data value
 * matches a sentinel value exactly, the designated color will be applied. No interpolation is done
 * for sentinel values.
 *
 * Note that each `ColorScale` object must contain a non-empty array for either `scale` or
 * `sentinel_values`. It's also possible to specify both. In that case, the application will first
 * match values against sentinel values. If no matching value is found, it will then colorize
 * according to the `scale`.
 *
 * As with schemas, one (and only one) color scale may be active at a given time. We specify when a
 * color scale is active with the "conditions" property.
 */
export interface ColorScale {

  /**
   * a `Conditions` object (defined below) specifying when this color scale will be active
   * If no conditions are specified, the color scale will always be active.
   */
  "conditions"?: Conditions;

  /**
   * text to display on the color scale legend when this color scale is active
   */
  "legend_label": string;

  /**
   * This optional property defines how to scale the offsets in the color scale according to the
   * display mode ("geo" vs. "aggregate") and for each detail level within "aggregate" mode.
   * default for each is { "factor": 1 } (i.e. no scaling)
   */
  "scaling"?: {
    "geo"?: Scaling;
    "aggregate"?: Scaling | {
      "admin0"?: Scaling;
      "admin1"?: Scaling;
      "admin2"?: Scaling;
    };
  };

  /**
   * array of `ColorStop` objects that comprise the scale (defined below)
   */
  "scale"?: ColorStop[];

  /**
   * array of `SentinelValue` objects that comprise individual non-numeric values depicted by their
   * associated `label`.
   */
  "sentinel_values"?: SentinelValue[];

  /**
   * distribution of stops in the legend. Typically this will be linear (the default), but for
   * certain types of data sets a logarithmic distribution, which provides greater resolution at the
   * lower end of the scale, may be more appropriate.
   */
  "legend_distribution"?: "linear" | "ln" | "log10";

  /**
   * a custom SVG (Scalable Vector Graphics) element to be used in place of the usual legend
   *
   * Note that the (outermost) SVG element must define the display dimensions. The simplest way to
   * do that is by defining the "height" and "width" attributes in terms of pixels, e.g.:
   *   <svg height="100" width="100" ...>...</svg>
   */
  "custom_legend"?: CustomLegend;
}

/**
 * object defined within the "scale" property of `ColorScale` (above) describing how to colorize a
 * specified data value
 */
export interface ColorStop {
  /**
   * HTML string representation of a color, e.g.: hex code, rgb, rgba, hsl, hsla, or color name
   */
  "color": string;

  /**
   * literal data value at which the specified color will be applied.
   */
  "offset": number;

  /**
   * optional label to show for this color stop on the color scale legend
   * If "{val}" appears within the string, it will be replaced by the value of the offset of the
   * color stop after scaling (if property "scaling" is defined for the color scale).
   */
  "label"?: string;
}

export interface SentinelValue extends ColorStop {
  /**
   * Label to show in relation to the color in the SentinelValue Legend.
   */
  "label": string;
}

export interface Scaling {
  /**
   * multiplier for each offset value in the color scale
   */
  "factor": number;
}

export interface CustomLegend {
  /**
   * relative path to an SVG file whose contents should be used for the custom legend
   */
  "filepath"?: string;
  /**
   * string representing an SVG element to be used for the custom legend;
   * if defined, takes precedence over the "filepath" property
   */
  "contents"?: string;
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
export interface Conditions {
  [dimensionName: string]: Array<string | number>;
}
