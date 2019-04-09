/**
 * Top-level configuration object for the theme
 */
export interface Config {
  /**
   * Specification version used by the theme
   */
  "version": string;

  /**
   * Name used internally as a unique identifier for the current theme
   *
   * Must be unique within a given deployment of the application and should ideally be as short as
   * possible without being cryptic
   */
  "name": string;

  /**
   * Name of the theme as displayed to the user
   */
  "display_name": string;

  /**
   * Details of the data representation
   */
  "data_format"?: DataFormat;

  /**
   * Default settings to show when the theme is first loading in the application
   */
  "default_display"?: DefaultDisplay;

  /**
   * URL from which a user may download the source data files
   */
  "download_url"?: string;

  /**
   * Relative path to the TIFF file to be applied as mask to each TIFF data file
   *
   * example: "data/raster/mask.tiff"
   *
   * The process of masking compares each data file, pixel by pixel, to the mask. If the mask
   * contains a "no data" value for a given pixel, the corresponding pixel in the output raster will
   * also have a "no data" value. Otherwise it will have the value from the corresponding pixel in
   * the data file.
   *
   * This property is required if [[DataFormat.raster]] is `true`.
   */
  "filepath_raster_mask"?: string;

  /**
   * Configuration for geographical features
   */
  "geography": Geography;

  /**
   * Tile server URL for the basemap that will be displayed UNDER the data layer
   *
   * default: "https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_nolabels/{z}/{x}/{y}.png"
   */
  "basemap_url"?: string;

  /**
   * Tile server URL for the basemap that will be displayed ON TOP OF the data layer (usu. labels)
   *
   * default: "https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_only_labels/{z}/{x}/{y}.png"
   */
  "basemap_labels_url"?: string;

  /**
   * Array of data dimensions used in the visualization
   */
  "dimensions": Dimension[];

  /**
   * Array of distinct data shapes used in the visualization
   */
  "schemas": Schema[];

  /**
   * Array of color scales used to colorize the data displayed on the map
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
   * Low-level floating-point representation of aggregate data values:
   * - "single": 32-bit
   * - "double": 64-bit
   *
   * In most cases, single precision should be sufficient; it provides seven to eight significant
   * digits. In case more significant digits are needed, double precision can be used instead, but
   * note that using double precision may result in a database that is significantly larger.
   *
   * NB: Because of the technical limitations of rendering pixels in the application, we always use
   * a 32-bit representation for raster data.
   *
   * default: "single"
   */
  "precision_aggregate"?: "single" | "double";

  /**
   * Numeric value in TIFF files that indicates the absence of data for a given pixel
   *
   * default: -999999
   */
  "no_data_value"?: number;

  /**
   * Zoom level represented by the source raster images, based on standard Google-style map tiling
   * (see: http://www.maptiler.org/google-maps-coordinates-tile-bounds-projection/)
   *
   * default: 5
   */
  "native_zoom"?: number;

  /**
   * Maximum (i.e. most detailed) admin level available; default: 2
   */
  "max_admin_level"?: AdminLevel;
}

export interface DefaultDisplay {
  /**
   * Display mode to show when the theme is first loaded; default: "aggregate"
   */
  "mode"?: "geo" | "aggregate";

  /**
   * Detail level to show when the theme is first loaded; default: 1
   */
  "level"?: AdminLevel;
}

/**
 * Level of administrative units on the map (where level 0 indicates nations)
 */
export type AdminLevel = 0 | 1 | 2;

/**
 * Configuration for geographical features
 */
export interface Geography {
  /**
   * Whitelist of location IDs used to filter the shapefiles
   *
   * We include only these admin0 locations and only admin1 and admin2 locations that are their
   * descendants.
   */
  "admin0_locations": number[];

  /**
   * List of location IDs for locations with no descendants
   *
   * Note that it's not necessary to list IDs for locations at the max admin level. We assume those
   * locations have no descendants. Instead, this list is used to specify deviations from the norm,
   * that is, branches of the location hierarchy that do not extend all the way down to the max
   * admin level.
   */
  "no_descendants"?: number[];

  /**
   * List of location IDs for which no raster data is available
   */
  "exclude_raster"?: number[];

  /**
   * List of location IDs for which no aggregate data is available
   */
  "exclude_aggregate"?: number[];
}

/**
 * Data dimension defined within the "dimensions" property of [[Config]]
 *
 * Dimensions are only meaningful within the context of a [[Schema]] (i.e. data shape). A dimension
 * defined here that is not referenced in any schema will not be used in the tool. We define
 * dimensions separately from schemas so that the same dimension may be used in multiple schemas
 * without having to be defined multiple times.
 */
export interface Dimension {
  /**
   * Name used internally as a unique identifier for the dimension
   *
   * Must be unique and should ideally be as short as possible without being cryptic
   */
  "name": string;

  /**
   * Name of the dimension as displayed to the user
   */
  "display_name": string;

  /**
   * Array of possible values for the dimension
   *
   * The `Option` type allows specifying the (unique) internal name and the name used for display
   * separately. Options may also be specified simply as numbers or strings. In that case the same
   * value (which must be unique) will be used both internally and for display.
   */
  "options": (string | number | Option)[];

  /**
   * Option to display by default when the tool starts
   *
   * default: the first element in the "options" array
   */
  "default_option"?: string | number;

  /**
   * Type of control widget the user will use to set the dimension; default: "select"
   */
  "widget_type"?:
    /**
     * Text selection box that displays the current option and expands to a scrollable list of
     * all options when clicked
     */
    | "select"
    /**
     * Draggable horizontal slider
     */
    | "slider"
    /**
     * Group of buttons, one for each option; one and only one button may be selected at a time
     */
    | "buttonset";

  /**
   * Enable the playback feature for this dimension?
   *
   * If enabled, we render a play button next to the dimension control. Pressing play begins a timed
   * sequence of state changes in which we step through the array of options for this dimension.
   *
   * default: false
   */
  "playable"?: boolean;

  /**
   * Tooltip text to explain the meaning of the dimension to the user
   */
  "help_text"?: string;
}

/**
 * An option (i.e. possible value) of a [[Dimension]]
 */
export interface Option {
  /**
   * unique identifier (unique for the current dimension, that is) used to represent the option
   * internally in the program and in the config file
   */
  "name": string;

  /**
   * the name shown to the user in the application
   */
  "display_name": string;
}

/**
 * Data shape defined within the "schemas" property of [[Config]], and referencing dimensions
 * defined within the "dimensions" property of [[Config]]
 *
 * The application supports multiple data shapes for a given theme. While the application is
 * running, one (and only one) schema may be active at a given time. We specify when a schema is
 * active with the "conditions" property. Essentially, one or more dimensions serve as schema
 * selectors. That is, when a user changes the value of such a dimension, he/she may change the
 * active schema. In the database, each schema is represented by a separate set of data tables.
 */
export interface Schema {
  /**
   * Unique name for the schema, used internally
   *
   * Should ideally be as short as possible without being cryptic
   */
  "name": string;

  /**
   * [[Conditions]] object specifying when this schema will be active
   *
   * If no conditions are specified, the schema will always be active.
   */
  "conditions"?: Conditions;

  /**
   * Data dimensions defined for this schema (not including schema-selector dimensions specified in
   * `conditions`)
   *
   * An array of strings referencing the `name` property of [[Dimension]] objects defined in the
   * `dimensions` property of the [[Config]] object
   */
  "dimensions"?: string[];

  /**
   * Template representing a relative path to the aggregate data files (CSVs) for this schema
   *
   * There must be one file for every combination of options of the dimensions defined within the
   * `dimensions` property. The template should contain a "wildcard" for each such dimension (i.e.
   * the name of the dimension enclosed in curly braces. When searching for files, the program will
   * substitute for each such wildcard the `name` property of each option defined for that
   * dimension. It's recommended to use some delimiting character, like _, between wildcards.
   *
   * *EXAMPLE:*
   *
   * ```
   * {
   *   "dimensions": [
   *     { "name": "dim1", "options": ["1a", "1b"], ... },
   *     { "name": "dim2", "options": ["2a", "2b"], ... }
   *   ],
   *   "filepath_template_aggregate": "data/aggregate/{dim1}_{dim2}.csv",
   *   ...
   * }
   * ```
   *
   * Expected files:
   * - data/aggregate/1a_2a.csv
   * - data/aggregate/1a_2b.csv
   * - data/aggregate/1b_2a.csv
   * - data/aggregate/1b_2b.csv
   */
  "filepath_template_aggregate"?: string;

  /**
   * Template representing a relative path to the raster data files (GeoTIFFs) for this schema
   *
   * The same guidelines apply as for [[Schema.filepath_template_aggregate]].
   */
  "filepath_template_raster"?: string;

  /**
   * Template representing the title text to display to the user when this schema is active
   *
   * May optionally contain wildcards that reference dimension names; in that case the wildcard
   * will be replaced with the `display_name` property of the current option selected for the
   * given dimension
   *
   * *EXAMPLE:*
   *
   * ```
   * {
   *   "dimensions": [
   *     { "name": "age", "options": ["children", "adults"], ... },
   *     { "name": "year", "options": [2000, 2010], ... }
   *   ]
   *   "ui_title_template": "Mortality for {age} in {year}",
   *   ...
   * }
   * ```
   *
   * Selected options:
   * - "age": "children"
   * - "year": 2010
   *
   * Rendered title: "Mortality for children in 2010"
   */
  "ui_title_template": string;

  /**
   * [[InfoDisplay]] configurations for this schema
   */
  "info_displays"?: InfoDisplay[];

  /**
   * When displaying data values, round to this many places after the decimal point.
   *
   * default: (no rounding)
   */
  "display_precision"?: number;
}

/**
 * Configuration for an info display component
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
 * Configuration for the bar chart display component
 */
export interface BarChart {
  "type": "bar_chart";

  /**
   * Dimension whose options comprise the categories in the bar chart
   *
   * In a normal bar chart, each category is represented by a single bar.
   * In a stacked bar chart, each category is represented by a stack.
   */
  "category_dimension": string;

  /**
   * Dimension whose options comprise the layers in a stacked bar chart (unused for normal bar chart)
   */
  "subcategory_dimension"?: string;
}

/**
 * Configuration for the line chart display component
 */
export interface LineChart {
  "type": "line_chart";

  /**
   * Dimension to show as the domain of the chart
   */
  "domain": string;

  /**
   * Configuration for one or more lines (or areas) to display on the chart
   *
   * If none specified, we show a line representing the values for the current data dimension
   * selections for each option of the `domain` dimension.
   */
  "lines"?: LineConfig[];
}

/**
 * Configuration for a line and/or area to display on a line chart
 */
export interface LineConfig {
  /**
   * Show the value not just for the currently selected option but for multiple options of the given
   * dimension (references the dimension's `name` property).
   */
  "expand_dimension": string;

  /**
   * Option from the `expand_dimension` for which the application should render a line
   */
  "line"?: string | number;

  /**
   * Options from the `expand_dimension` for which the application should render a shaded area.
   *
   * To be more precise, we draw two lines, one for "upper" and one for "lower", and we shade the
   * area in between. This is useful for showing a range or interval, like a statistical uncertainty
   * interval.
   *
   * NB: It is an error to define only one of these properties; if one is specified, both must be
   * specified.
   */
  "upper"?: string | number;
  "lower"?: string | number;
}

/**
 * Configuration for the values display component
 *
 * Values is a very simple component. It just displays numeric data values for the currently
 * selected pixel/feature and the corresponding color based on the current [[ColorScale]].
 */
export interface ValuesDisplay {
  "type": "values";

  /**
   * Show the value not just for the currently selected option but for ALL options of the given
   * dimension (references the dimension's `name` property)
   */
  "expand_dimension"?: string;
}

/**
 * Color scale defined within the "color_scales" property of [[Config]]
 *
 * The application can colorize the data displayed on the map using a variety of "color scales"
 * for a given theme. Each scale specifies a list of reference colors and the data values to which
 * those colors should be applied. Values in between reference values will be colorized with an
 * interpolated color.
 *
 * It's also possible to specify one or more fixed values, i.e. "sentinel values". If a data value
 * matches a sentinel value exactly, the designated color will be applied. No interpolation is done
 * for values that fall between the specified sentinel values.
 *
 * Note that each `ColorScale` object must contain a non-empty array for either `scale` or
 * `sentinel_values`. It's also possible to specify both. In that case, the application will first
 * match values against sentinel values. If no matching value is found, it will then colorize
 * according to the `scale`.
 *
 * As with schemas, one (and only one) color scale may be active at a given time. We specify when a
 * color scale is active with the `conditions` property.
 */
export interface ColorScale {
  /**
   * [[Conditions]] object specifying when this color scale will be active
   *
   * If no conditions are specified, the color scale will always be active.
   */
  "conditions"?: Conditions;

  /**
   * Text to display on the color scale legend when this color scale is active
   */
  "legend_label": string;

  /**
   * This optional property defines how to scale the offsets in the color scale in aggregate mode.
   *
   * Scaling can be defined separately for each administrative level, or the same scaling can be
   * used for all levels.
   *
   * default: `{ "factor": 1 }` (i.e. no scaling)
   */
  "scaling_aggregate"?: Scaling | ScalingByAdmin;

  /**
   * This optional property defines how to scale the offsets in the color scale in geospatial mode.
   */
  "scaling_geospatial"?: Scaling;

  /**
   * Array of [[ColorStop]] objects used for colorizing via linear interpolation
   */
  "scale"?: ColorStop[];

  /**
   * Array of [[SentinelValue]] objects used for colorizing via exact match
   */
  "sentinel_values"?: SentinelValue[];

  /**
   * Distribution of stops in the legend
   *
   * Typically this will be linear, but for certain types of data sets a logarithmic distribution,
   * which provides greater resolution at the lower end of the scale, may be more appropriate.
   *
   * default: "linear"
   */
  "legend_distribution"?: "linear" | "ln" | "log10";

  /**
   * Custom SVG (Scalable Vector Graphics) element to be used in place of the usual legend
   *
   * Note that the (outermost) SVG element must define the display dimensions. The simplest way to
   * do that is by defining the `height` and `width` attributes in terms of pixels, e.g.:
   *
   * ```
   * <svg height="100" width="100" ...>...</svg>
   * ```
   */
  "custom_legend"?: CustomLegend;
}

/**
 * Scaling configuration for each administrative level
 *
 * default for each level: `{ "factor": 1 }` (i.e. no scaling)
 */
interface ScalingByAdmin {
  "admin0"?: Scaling,
  "admin1"?: Scaling,
  "admin2"?: Scaling,
}

/**
 * Object defined within [[ColorScale.scale]] describing how to colorize data values
 */
export interface ColorStop {
  /**
   * HTML string representation of a color, e.g.: hex code, rgb, rgba, hsl, hsla, or color name
   */
  "color": string;

  /**
   * Value at which the specified color will be applied
   */
  "offset": number;

  /**
   * Optional label to show for this color stop on the color scale legend
   *
   * If "{val}" appears within the string, it will be replaced by the value of the offset of the
   * color stop. If [[ColorScale.scaling]] is defined for the scale in question, "{val}" represents
   * the value _after_ the scaling has been applied.
   */
  "label"?: string;
}

export interface SentinelValue extends ColorStop {
  /**
   * Label associated with the sentinel value
   */
  "label": string;
}

export interface Scaling {
  /**
   * Multiplier for each color scale offset
   */
  "factor": number;
}

export interface CustomLegend {
  /**
   * Relative path to an SVG file whose contents should be used for the custom legend
   */
  "filepath"?: string;

  /**
   * String representing an SVG element to be used for the custom legend
   *
   * If defined, takes precedence over the `filepath` property
   */
  "contents"?: string;
}

/**
 * Mapping from dimension `name` to an array of option `name`s
 *
 * Used in both [[Schema]] and [[ColorScale]] to determine when the schema/color-scale is active
 */
export interface Conditions {
  /**
   * Mapping from dimension `name` to an array of option `name`s
   *
   * The condition is satisfied if for each dimension specified, the current option is among those
   * listed.
   *
   * *EXAMPLE:*
   * ```
   * {
   *   dimensions: [
   *     { "name": "data-shape", "options": ["data-shape-1", "data-shape-2"], ... },
   *     // ...
   *   ],
   *   conditions: { "data-shape": ["data-shape-1"] }
   * }
   * ```
   * ACTIVE if "data-shape" is "data-shape-1"; INACTIVE otherwise
   */
  [dimensionName: string]: Array<string | number>;
}
