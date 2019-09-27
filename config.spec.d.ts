/**
 * Top-level configuration for the theme
 */
export interface Config {
  /**
   * Specification version used by the theme
   *
   * Accepts any valid [semver](https://semver.org) string
   */
  "version": string;

  /**
   * Name of the theme, used internally
   *
   * Must be unique within a given deployment of the application and should ideally be as short as
   * possible without being cryptic
   */
  "name": string;

  /**
   * Name of the theme, as displayed to the user
   */
  "display_name": string;

  /**
   * Details of the data representation
   */
  "data_format"?: DataFormat;

  /**
   * Default settings to show in the application when the theme is first loaded
   */
  "default_display"?: DefaultDisplay;

  /**
   * URL from which a user may download the source data files
   */
  "download_url"?: string;

  /**
   * Relative path to a GeoTIFF file to be applied as mask to each GeoTIFF data file
   *
   * *Example:* "data/raster/mask.tiff"
   *
   * The process of masking compares each data file, pixel by pixel, to the mask. If the mask
   * contains a "no data" value for a given pixel, the corresponding pixel in the output raster will
   * also have a "no data" value. Otherwise it will have the value from the corresponding pixel in
   * the data file.
   *
   * If this field is absent, no masking will occur.
   */
  "filepath_raster_mask"?: string;

  /**
   * Configuration related to geographical features
   */
  "geography"?: Geography;

  /**
   * Tile URL for the basemap that will be displayed _under_ the data layer
   *
   * default: "https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_nolabels/{z}/{x}/{y}.png"
   */
  "basemap_url"?: string;

  /**
   * Tile URL for the basemap that will be displayed _on top of_ the data layer (usu. text labels)
   *
   * default: "https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_only_labels/{z}/{x}/{y}.png"
   */
  "basemap_labels_url"?: string;

  /**
   * Array of data dimensions used in the theme
   */
  "dimensions": Dimension[];

  /**
   * Array of distinct data shapes used in the theme
   */
  "schemas": Schema[];

  /**
   * Array of color scales used to colorize map features according to their associated data values
   */
  "color_scales": ColorScale[];
}

/**
 * Details of the data representation
 */
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

/**
 * Default settings to show in the application when the theme is first loaded
 */
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
 * Represents a unique identifier for locations
 */
export type LocationID = number | string;

/**
 * Configuration related to geographical features
 */
export interface Geography {
  /**
   * Whitelist of location IDs used to filter the shapefiles
   *
   * We include only these admin0 locations and only admin1 and admin2 locations that are their
   * descendants. If this field is not specified, no filtering will occur.
   */
  "admin0_locations"?: LocationID[];

  /**
   * List of location IDs for locations with no descendants
   *
   * Note that it's not necessary to list IDs for locations at the max admin level
   * ([[DataFormat.max_admin_level]]). We assume those locations have no descendants. Instead, this
   * list is used to specify deviations from the norm, that is, branches of the location hierarchy
   * that do not extend all the way down to the max admin level.
   */
  "no_descendants"?: LocationID[];

  /**
   * List of location IDs for which no raster data is available
   */
  "exclude_raster"?: LocationID[];

  /**
   * List of location IDs for which no aggregate data is available
   */
  "exclude_aggregate"?: LocationID[];

  /**
   * Show territorial disputes between countries? If `true`, a file containing the geometries of the
   * disputed areas must be provided.
   *
   * default: true
   */
  "territorial_disputes"?: boolean;

  /**
   * Configuration for the shapefiles containing the geometries of administrative units
   */
  "admin_files"?: AdminFiles;

  /**
   * Configuration for the shapefile containing the geometries of disputed areas
   */
  "disputes_file"?: DisputesFile;

  /**
   * Configuration for the root location, which represents all locations
   *
   * default:
   * ```json
   * {
   *   "id": 0,
   *   "name": "All"
   * }
   * ```
   */
  "root_location"?: LocationMetadata;

  /**
   * Array of custom text pertaining to specified locations and their descendants.
   */
  "custom_text"?: CustomText[];
}

/**
 * Configuration for the shapefiles containing the geometries of administrative units
 */
export interface AdminFiles {
  /**
   * Relative paths to the administrative shapefiles.
   *
   * The index in the array corresponds to the admin level, so the first item represents admin0, the
   * second admin1, etc.
   *
   * default:
   * ```json
   * ["shapefiles/admin{N}/admin{N}.shp", ...]
   * ```
   * where {N} represents each admin level from 0 up to the max admin level
   */
  "filepaths"?: string[];

  /**
   * Names of the metadata fields for each feature in the administrative shapefiles
   *
   * The index in the array corresponds to the admin level, so the first item represents fields for
   * admin0, the second fields for admin1, etc.
   *
   * default:
   * ```json
   * [
   *   { "id": "ADM{N}_CODE", "name": "ADM{N}_NAME" },
   *   ...
   * ]
   * ```
   * where {N} represents each admin level from 0 up to the max admin level
   */
  "fieldnames"?: AdminFieldnames[];
}

/**
 * Configuration for the shapefile containing the geometries of disputed areas
 */
export interface DisputesFile {
  /**
   * Relative path to the disputes shapefile
   *
   * default: "shapefiles/disputes/disputes.shp"
   */
  "filepath"?: string;

  /**
   * Names of the metadata fields for each feature in the disputes shapefile
   *
   * default:
   * ```json
   * {
   *   "id": "ADM0_CODE",
   *   "name": "ADM0_NAME",
   *   "claimants": "claimants",
   * }
   * ```
   */
  "fieldnames"?: DisputesFieldnames;
}

/**
 * Names of the metadata fields for each feature in the shapefiles containing administrative units
 */
export interface AdminFieldnames {
  /**
   * Name of the field containing the unique ID of the feature
   */
  "id": string;

  /**
   * Name of the field containing the name of the feature
   */
  "name": string;
}

/**
 * Names of the metadata fields for each feature in the shapefile containing disputed territories
 */
export interface DisputesFieldnames extends AdminFieldnames {
  /**
   * Name of the field containing the unique IDs of the countries (admin0 locations) that claim the
   * disputed area (as a comma-separated list)
   */
  "claimants": string;
}

/**
 * Metadata for a location
 */
export interface LocationMetadata {
  /**
   * Unique ID of the location
   */
  "id": LocationID;

  /**
   * Name of the location
   */
  "name": string;
}

/**
 * Custom text to be displayed for specified locations and their respective descendants.
 */
export interface CustomText {
  /**
   * List of location IDs for which custom text will be displayed.
   */
  "locations": LocationID[];

  /**
   * Text to be displayed for each location and its descendants.
   */
  "text": string;
}

/**
 * Data dimension defined in [[Config.dimensions]]
 *
 * Dimensions are only meaningful within the context of a [[Schema]]. A [[Schema]] is in essence
 * simply a set of dimensions that describe the shape of the data.
 *
 * A dimension defined here that is not referenced in any schema will not be used in the tool. We
 * define dimensions separately from schemas so that the same dimension may be used in multiple
 * schemas without having to be defined multiple times.
 */
export interface Dimension {
  /**
   * Name used internally as a unique identifier for the dimension. Other parts of the config,
   * like [[Schema.dimensions]], can reference a dimension by this name.
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
   * The [[Option]] type allows specifying the (unique) internal name and the name used for display
   * separately. Options may also be specified simply as numbers or strings. In that case the same
   * value (which must be unique) will be used both internally and for display.
   */
  "options": Array<string | number | Option>;

  /**
   * Option to display by default before the user has made a selection
   *
   * default: the first element in the [[Dimension.options]] array
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
   * Unique identifier (unique for the current dimension, that is) used to represent the option
   * internally in the program and in the config file (like in [[Conditions]])
   */
  "name": string;

  /**
   * Name shown to the user in the application
   */
  "display_name": string;
}

/**
 * Data shape defined in [[Config.schemas]] and referencing dimensions defined in
 * [[Config.dimensions]]
 *
 * The application supports multiple data shapes for a given theme. A [[Schema]] is in essence
 * a set of dimensions that describe the shape of the data.
 *
 * While the application is running, one (and only one) schema may be active at a given time. We
 * specify when a schema is active with the `conditions` property. Essentially, one or more
 * dimensions serve as schema selectors. That is, when a user changes the value of such a dimension,
 * he/she may change the active schema. In the database, each schema is represented by a separate
 * set of data tables.
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
   * An array of strings, referencing dimensions defined in [[Config.dimensions]] via the
   * [[Dimension.name]] property
   */
  "dimensions"?: string[];

  /**
   * Template representing a relative path to the aggregate data files (CSVs) for this schema
   *
   * There must be one file for every combination of options of the dimensions defined within the
   * `dimensions` property. The template should contain a "wildcard" for each such dimension (i.e.
   * the name of the dimension enclosed in curly braces. When searching for files, the program will
   * substitute for each such wildcard the [[Option.name]] property of each option defined for that
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
   * Disable visualization of geo or aggregate data for this schema?
   */
  "disable_mode"?: "geo" | "aggregate";

  /**
   * Template representing the title text to display to the user when this schema is active
   *
   * May optionally contain wildcards that reference dimension names; in that case the wildcard
   * will be replaced with the [[Option.display_name]] property of the current option selected for
   * the given dimension
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
   * Display component configuration(s) for this schema
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
   * Text label to show above the chart
   */
  "label"?: string;

  /**
   * Dimension whose options comprise the categories in the bar chart; references [[Dimension.name]]
   *
   * In a normal bar chart, each category is represented by a single bar.
   * In a stacked bar chart, each category is represented by a stack.
   */
  "category_dimension": string;

  /**
   * Dimension whose options comprise the layers in a stacked bar chart (unused for normal bar
   * charts); references [[Dimension.name]]
   */
  "subcategory_dimension"?: string;

  /**
   * Display data from a schema other than the currently selected schema.
   *
   * If this field is not supplied, the current schema will be queried.
   */
  "cross_schema"?: CrossSchema;
}

export interface CrossSchema {
  /**
   * Name of the schema to query; references [[Schema.name]]
   */
  "name": string;

  /**
   * For each dimension of the schema, the option that will be used in the query. Any dimension
   * in common between the current schema and the schema to be queried may be omitted from the
   * filter. In that case, the currently selected option for the dimension will be used for the
   * query.
   *
   * For a bar chart, the dimensions used as [[BarChart.category_dimension]] and
   * [[BarChart.subcategory_dimension]], if applicable, should be omitted from the filter.
   *
   * For a line chart, the dimensions used as [[LineChart.domain]], [[LineChart.split_dimension]],
   * and [[Area.expand_dimension]], if applicable, should be omitted from the filter.
   *
   * This field may be omitted entirely if there aren't any dimensions to filter.
   */
  "dimension_filter"?: DimensionFilter;
}

/**
 * The option value for each dimension that should be used in a cross-schema query
 *
 * When querying the current schema, it's straightforward to determine which options to use, namely,
 * the currently selected options. When querying a schema other than the active schema, though, we
 * need to supply these options explicitly.
 */
export interface DimensionFilter {
  /**
   * Mapping of dimension name (referencing [[Dimension.name]]) to the corresponding option
   * (referencing [[Option.name]]) to use in the query
   */
  [dimensionName: string]: string | number;
}

/**
 * Configuration for the line chart display component
 */
export interface LineChart {
  "type": "line_chart";

  /**
   * Text label to show above the chart
   */
  "label"?: string;

  /**
   * Dimension to show as the domain of the chart; references [[Dimension.name]]
   */
  "domain": string;

  /**
   * Dimension whose options will be rendered as separate lines (and/or areas); references
   * [[Dimension.name]]. If not provided, only a single line/area will be rendered.
   */
  "split_dimension"?: string;

  /**
   * Configures the chart to display a shaded area instead of (or in addition to) a line. This can
   * be useful for showing a range or interval, like a statistical uncertainty interval.
   */
  "area"?: Area;

  /**
   * Display data from a schema other than the currently selected schema.
   *
   * The schema indicated must include the dimensions referenced as `domain` and `split_dimension`,
   * if applicable. If this
   * field is not supplied, the current schema will be queried.
   */
  "cross_schema"?: CrossSchema;
}

/**
 * Configuration for a displaying a shaded area on the chart, instead of (or in addition to) a line
 *
 * `expand_dimension` designates a dimension of the schema that we'll pick apart, visualizing one or
 * more of its `options` as a line or shaded area. It doesn't matter whether or not the map view
 * is currently visualizing the option in question; we can still show it in the line chart.
 *
 * We draw a shaded area by referencing two options of the `expand_dimension` as the `upper` and
 * `lower` properties. To be more precise, we draw two lines (one for `upper` and one for `lower`),
 * and we shade the area in between.
 *
 * In addition to the shaded area, we can optionally draw a line by referencing a single option of
 * the `expand_dimension` with the `line` property. Note that if _only_ a line is desired (with no
 * shaded area), `Area` is not needed at all.
 */
export interface Area {
  /**
   * Dimension of the schema whose options are referenced in the `line`, `upper`, and/or `lower`
   * properties
   *
   * The dimension is referenced via [[Dimension.name]], as defined in [[Config.dimensions]].
   */
  "expand_dimension": string;

  /**
   * Option from the `expand_dimension` for which the application should render a line; references
   * [[Option.name]]
   */
  "line"?: string | number;

  /**
   * Option from the `expand_dimension` for which the application should render the upper bound
   * of a shaded area; references [[Option.name]]
   */
  "upper": string | number;

  /**
   * Option from the `expand_dimension` for which the application should render the lower bound
   * of a shaded area; references [[Option.name]]
   */
  "lower": string | number;
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
   * Text label to show above the display
   */
  "label"?: string;

  /**
   * Show the value not just for the currently selected option but for ALL options of the given
   * dimension (references [[Dimension.name]])
   */
  "expand_dimension"?: string;

  /**
   * Display data from a schema other than the currently selected schema.
   *
   * The schema indicated must include the dimension referenced as `expand_dimension`, if
   * applicable. If this field is not supplied, the current schema will be queried.
   */
  "cross_schema"?: CrossSchema;
}

/**
 * Rules for colorizing map features according to their associated data values
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
   */
  "custom_legend"?: CustomLegend;
}

/**
 * Scaling configuration for each administrative level
 *
 * default for each level: `{ "factor": 1 }` (i.e. no scaling)
 */
interface ScalingByAdmin {
  "admin0"?: Scaling;
  "admin1"?: Scaling;
  "admin2"?: Scaling;
}

/**
 * Object defined within [[ColorScale.scale]] describing how to colorize features via linear
 * interpolation
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
   * If `"{val}"` appears within the string, it will be replaced by the value of the offset of the
   * color stop. If [[ColorScale.scaling_aggregate]] or [[ColorScale.scaling_geospatial]] are
   * defined for the scale in question, `"{val}"` represents the value _after_ the scaling has been
   * applied.
   */
  "label"?: string;
}

/**
 * Object defined within [[ColorScale.sentinel_values]] describing how to colorize features via
 * exact value match
 */
export interface SentinelValue extends ColorStop {
  /**
   * Label associated with the sentinel value
   *
   * Note that `label` is required in a `SentinelValue`, whereas it's optional in a `ColorStop`.
   * That's because the `offset` of a sentinel value is simply an arbitrary index with no
   * specific meaning; the `label` alone conveys the meaning of a sentinel value.
   */
  "label": string;
}

/**
 * Rule describing how to scale offsets in a [[ColorScale]]
 */
export interface Scaling {
  /**
   * Multiplier for each color scale offset
   */
  "factor": number;
}

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
 * Representation of the conditions under which a given schema or color scale is active
 */
export interface Conditions {
  /**
   * Mapping from a dimension name to a subset of its options (referencing [[Option.name]]) for which
   * the schema or color scale is active
   *
   * The condition is satisfied if for each dimension specified, the currently selected option is
   * among those listed.
   *
   * *EXAMPLE:*
   * ```
   * {
   *   dimensions: [
   *     { "name": "data-shape", "options": ["data-shape-1", "data-shape-2"], ... },
   *     ...
   *   ],
   *   conditions: { "data-shape": ["data-shape-1"] }
   * }
   * ```
   * ACTIVE if "data-shape" is "data-shape-1"; INACTIVE otherwise
   */
  [dimensionName: string]: Array<string | number>;
}
