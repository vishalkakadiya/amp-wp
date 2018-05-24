/* exported ampEditorBlocks */
/* eslint no-magic-numbers: [ "error", { "ignore": [ 1, -1, 0 ] } ] */

var ampEditorBlocks = ( function() { // eslint-disable-line no-unused-vars
	var component, __;

	__ = wp.i18n.__;

	component = {

		/**
		 * Holds data.
		 */
		data: {
			ampLayoutOptions: [
				{
					value: 'nodisplay',
					label: __( 'No Display' ),
					notAvailable: [
						'core-embed/vimeo',
						'core-embed/dailymotion',
						'core-embed/hulu',
						'core-embed/reddit',
						'core-embed/soundcloud'
					]
				},
				{
					// Not supported by amp-audio and amp-pixel.
					value: 'fixed',
					label: __( 'Fixed' ),
					notAvailable: [
						'core-embed/soundcloud'
					]
				},
				{
					// To ensure your AMP element displays, you must specify a width and height for the containing element.
					value: 'responsive',
					label: __( 'Responsive' ),
					notAvailable: [
						'core/audio',
						'core-embed/soundcloud'
					]
				},
				{
					value: 'fixed-height',
					label: __( 'Fixed height' ),
					notAvailable: []
				},
				{
					value: 'fill',
					label: __( 'Fill' ),
					notAvailable: [
						'core/audio',
						'core-embed/soundcloud'
					]
				},
				{
					value: 'flex-item',
					label: __( 'Flex Item' ),
					notAvailable: [
						'core/audio',
						'core-embed/soundcloud'
					]
				},
				{
					// Not supported by video.
					value: 'intrinsic',
					label: __( 'Intrinsic' ),
					notAvailable: [
						'core/audio',
						'core-embed/youtube',
						'core-embed/facebook',
						'core-embed/instagram',
						'core-embed/vimeo',
						'core-embed/dailymotion',
						'core-embed/hulu',
						'core-embed/reddit',
						'core-embed/soundcloud'
					]
				}
			],
			defaultWidth: 608, // Max-width in the editor.
			defaultHeight: 400,
			mediaBlocks: [
				'core/image',
				'core/video',
				'core/audio'
			],
			textBlocks: [
				'core/paragraph',
				'core/heading',
				'core/code',
				'core/quote',
				'core/subhead'
			],
			ampSettingsLabel: __( 'AMP Settings' ),
			fontSizes: {
				small: 14,
				larger: 48
			}
		}
	};

	/**
	 * Set data, add filters.
	 */
	component.boot = function boot() {
		wp.hooks.addFilter( 'blocks.registerBlockType', 'ampEditorBlocks/addAttributes', component.addAMPAttributes );
		wp.hooks.addFilter( 'blocks.getSaveElement', 'ampEditorBlocks/filterSave', component.filterBlocksSave );
		wp.hooks.addFilter( 'blocks.BlockEdit', 'ampEditorBlocks/filterEdit', component.filterBlocksEdit );
		wp.hooks.addFilter( 'blocks.getSaveContent.extraProps', 'ampEditorBlocks/addExtraAttributes', component.addAMPExtraProps );
	};

	/**
	 * Check if layout is available for the block.
	 *
	 * @param {string} blockName Block name.
	 * @param {Object} option Layout option object.
	 * @return {boolean} If is available.
	 */
	component.isLayoutAvailable = function isLayoutAvailable( blockName, option ) {
		return -1 === option.notAvailable.indexOf( blockName );
	};

	/**
	 * Get layout options depending on the block.
	 *
	 * @param {string} blockName Block name.
	 * @return {[*]} Options.
	 */
	component.getLayoutOptions = function getLayoutOptions( blockName ) {
		var layoutOptions = [
			{
				value: '',
				label: __( 'Default' )
			}
		];

		_.each( component.data.ampLayoutOptions, function( option ) {
			if ( component.isLayoutAvailable( blockName, option ) ) {
				layoutOptions.push( {
					value: option.value,
					label: option.label
				} );
			}
		} );

		return layoutOptions;
	};

	/**
	 * Add extra data-amp-layout attribute to save to DB.
	 *
	 * @param {Object} props Properties.
	 * @param {string} blockType Block type.
	 * @param {Object} attributes Attributes.
	 * @return {Object} Props.
	 */
	component.addAMPExtraProps = function addAMPExtraProps( props, blockType, attributes ) {
		var ampAttributes = {};
		if ( ! attributes.ampLayout && ! attributes.ampNoLoading ) {
			return props;
		}

		if ( attributes.ampLayout ) {
			ampAttributes[ 'data-amp-layout' ] = attributes.ampLayout;
		}
		if ( attributes.ampNoLoading ) {
			ampAttributes[ 'data-amp-noloading' ] = attributes.ampNoLoading;
		}

		return _.extend( ampAttributes, props );
	};

	/**
	 * Add AMP attributes (in this test case just ampLayout) to every core block.
	 *
	 * @param {Object} settings Settings.
	 * @param {string} name Block name.
	 * @return {Object} Settings.
	 */
	component.addAMPAttributes = function addAMPAttributes( settings, name ) {
		// Gallery settings for shortcode.
		if ( 'core/shortcode' === name ) {
			if ( ! settings.attributes ) {
				settings.attributes = {};
			}
			settings.attributes.ampCarousel = {
				type: 'boolean'
			};
		}

		// Fit-text for text blocks.
		if ( -1 !== component.data.textBlocks.indexOf( name ) ) {
			if ( ! settings.attributes ) {
				settings.attributes = {};
			}
			settings.attributes.ampFitText = {
				type: 'boolean',
				default: false
			};
			settings.attributes.minFont = {
				type: 'number',
				default: component.data.fontSizes.small,
				source: 'attribute',
				selector: 'amp-fit-text',
				attribute: 'min-font-size'
			};
			settings.attributes.maxFont = {
				type: 'number',
				default: component.data.fontSizes.larger,
				source: 'attribute',
				selector: 'amp-fit-text',
				attribute: 'max-font-size'
			};
			settings.attributes.height = {
				type: 'number',
				default: 50,
				source: 'attribute',
				selector: 'amp-fit-text',
				attribute: 'height'
			};
		}

		// Layout settings for embeds and media blocks.
		if ( 0 === name.indexOf( 'core-embed' ) || -1 !== component.data.mediaBlocks.indexOf( name ) ) {
			if ( ! settings.attributes ) {
				settings.attributes = {};
			}
			settings.attributes.ampLayout = {
				type: 'string'
			};
			settings.attributes.ampNoLoading = {
				type: 'boolean'
			};
		}
		return settings;
	};

	/**
	 * Filters blocks edit function of all blocks.
	 *
	 * @param {Function} BlockEdit Edit function.
	 * @return {Function} Edit function.
	 */
	component.filterBlocksEdit = function filterBlocksEdit( BlockEdit ) {
		var el = wp.element.createElement;

		return function( props ) {
			var attributes = props.attributes,
				name = props.name,
				ampLayout,
				inspectorControls;

			ampLayout = attributes.ampLayout;

			if ( 'core/shortcode' === name ) {
				inspectorControls = component.setUpShortcodeInspectorControls( props );
				if ( '' === inspectorControls ) {
					// Return original.
					return [
						el( BlockEdit, _.extend( {
							key: 'original'
						}, props ) )
					];
				}
			} else if ( -1 !== component.data.mediaBlocks.indexOf( name ) || 0 === name.indexOf( 'core-embed/' ) ) {
				inspectorControls = component.setUpInspectorControls( props );
			} else if ( -1 !== component.data.textBlocks.indexOf( name ) ) {
				inspectorControls = component.setUpTextBlocksInspectorControls( props );
			}

			// Return just inspector controls in case of 'nodisplay'.
			if ( ampLayout && 'nodisplay' === ampLayout ) {
				return [
					inspectorControls
				];
			}

			return [
				inspectorControls,
				el( BlockEdit, _.extend( {
					key: 'original'
				}, props ) )
			];
		};
	};

	/**
	 * Set width and height in case of image block.
	 *
	 * @param {Object} props Props.
	 * @param {string} layout Layout.
	 */
	component.setImageBlockLayoutAttributes = function setImageBlockLayoutAttributes( props, layout ) {
		var attributes = props.attributes;
		switch ( layout ) {
			case 'fixed-height':
				if ( ! attributes.height ) {
					props.setAttributes( { height: component.data.defaultHeight } );
				}
				break;

			case 'fixed':
				if ( ! attributes.height ) {
					props.setAttributes( { height: component.data.defaultHeight } );
				}
				if ( ! attributes.width ) {
					props.setAttributes( { width: component.data.defaultWidth } );
				}
				break;
		}
	};

	/**
	 * Default setup for inspector controls.
	 *
	 * @param {Object} props Props.
	 * @return {Object|Element|*|{$$typeof, type, key, ref, props, _owner}} Inspector Controls.
	 */
	component.setUpInspectorControls = function setUpInspectorControls( props ) {
		var ampLayout = props.attributes.ampLayout,
			ampNoLoading = props.attributes.ampNoLoading,
			isSelected = props.isSelected,
			name = props.name,
			el = wp.element.createElement,
			InspectorControls = wp.editor.InspectorControls,
			SelectControl = wp.components.SelectControl,
			ToggleControl = wp.components.ToggleControl,
			PanelBody = wp.components.PanelBody,
			label = __( 'AMP Layout' );

		if ( 'core/image' === name ) {
			label = __( 'AMP Layout (modifies width/height)' );
		}

		return isSelected && (
			el( InspectorControls, { key: 'inspector' },
				el( PanelBody, { title: __( 'AMP Settings' ) },
					el( SelectControl, {
						label: label,
						value: ampLayout,
						options: component.getLayoutOptions( name ),
						onChange: function( value ) {
							props.setAttributes( { ampLayout: value } );
							if ( 'core/image' === props.name ) {
								component.setImageBlockLayoutAttributes( props, value );
							}
						}
					} ),
					el( ToggleControl, {
						label: __( 'AMP loading indicator disabled' ),
						checked: ampNoLoading,
						onChange: function() {
							props.setAttributes( { ampNoLoading: ! ampNoLoading } );
						}
					} )
				)
			)
		);
	};

	/**
	 * Setup inspector controls for text blocks.
	 *
	 * @param {Object} props Props.
	 * @return {Object|Element|*|{$$typeof, type, key, ref, props, _owner}} Inspector Controls.
	 */
	component.setUpTextBlocksInspectorControls = function setUpInspectorControls( props ) {
		var ampFitText = props.attributes.ampFitText,
			minFont = props.attributes.minFont,
			maxFont = props.attributes.maxFont,
			height = props.attributes.height,
			isSelected = props.isSelected,
			el = wp.element.createElement,
			InspectorControls = wp.editor.InspectorControls,
			TextControl = wp.components.TextControl,
			FontSizePicker = wp.components.FontSizePicker,
			ToggleControl = wp.components.ToggleControl,
			PanelBody = wp.components.PanelBody,
			label = __( 'Use AMP Fit Text' ),
			FONT_SIZES = [
				{
					name: 'small',
					shortName: __( 'S' ),
					size: 14
				},
				{
					name: 'regular',
					shortName: __( 'M' ),
					size: 16
				},
				{
					name: 'large',
					shortName: __( 'L' ),
					size: 36
				},
				{
					name: 'larger',
					shortName: __( 'XL' ),
					size: 48
				}
			];

		if ( ampFitText ) {
			return isSelected && (
				el( InspectorControls, { key: 'inspector' },
					el( PanelBody, { title: component.data.ampSettingsLabel, className: 'is-amp-fit-text' },
						el( ToggleControl, {
							label: label,
							checked: ampFitText,
							onChange: function() {
								props.setAttributes( { ampFitText: ! ampFitText } );
							}
						} ),
						el( TextControl, {
							label: __( 'Height' ),
							value: height,
							type: 'number',
							min: 1,
							onChange: function( nextHeight ) {
								props.setAttributes( { height: nextHeight } );
							}
						} ),
						maxFont > height && el(
							wp.components.Notice,
							{
								status: 'error',
								isDismissible: false
							},
							__( 'The height must be greater than the max font size.' )
						),
						el( PanelBody, { title: __( 'Minimum font size' ) },
							el( FontSizePicker, {
								fallbackFontSize: 14,
								value: minFont,
								fontSizes: FONT_SIZES,
								onChange: function( nextMinFont ) {
									if ( ! nextMinFont ) {
										nextMinFont = component.data.fontSizes.small; // @todo Supplying fallbackFontSize should be done automatically by the component?
									}
									if ( nextMinFont <= maxFont ) {
										props.setAttributes( { minFont: nextMinFont } );
									}
								}
							} )
						),
						minFont > maxFont && el(
							wp.components.Notice,
							{
								status: 'error',
								isDismissible: false
							},
							__( 'The min font size must less than the max font size.' )
						),
						el( PanelBody, { title: __( 'Maximum font size' ) },
							el( FontSizePicker, {
								value: maxFont,
								fallbackFontSize: 48,
								fontSizes: FONT_SIZES,
								onChange: function( nextMaxFont ) {
									if ( ! nextMaxFont ) {
										nextMaxFont = component.data.fontSizes.larger; // @todo Supplying fallbackFontSize should be done automatically by the component?
									}
									props.setAttributes( {
										maxFont: nextMaxFont,
										height: Math.max( nextMaxFont, height )
									} );
								}
							} )
						)
					)
				)
			);
		}

		return isSelected && (
			el( InspectorControls, { key: 'inspector' },
				el( PanelBody, { title: component.data.ampSettingsLabel },
					el( ToggleControl, {
						label: label,
						checked: ampFitText,
						onChange: function() {
							props.setAttributes( { ampFitText: ! ampFitText } );
						}
					} )
				)
			)
		);
	};

	/**
	 * Set up inspector controls for shortcode block.
	 * Adds ampCarousel attribute in case of gallery shortcode.
	 *
	 * @param {Object} props Props.
	 * @return {*} Inspector controls.
	 */
	component.setUpShortcodeInspectorControls = function setUpShortcodeInspectorControls( props ) {
		var ampCarousel = props.attributes.ampCarousel,
			isSelected = props.isSelected,
			el = wp.element.createElement,
			InspectorControls = wp.editor.InspectorControls,
			ToggleControl = wp.components.ToggleControl,
			PanelBody = wp.components.PanelBody,
			toggleControl;

		if ( component.isGalleryShortcode( props.attributes ) ) {
			toggleControl = el( ToggleControl, {
				label: __( 'Display as AMP carousel' ),
				checked: ampCarousel,
				onChange: function() {
					props.setAttributes( { ampCarousel: ! ampCarousel } );
				}
			} );
			return isSelected && (
				el( InspectorControls, { key: 'inspector' },
					el( PanelBody, { title: __( 'AMP Settings' ) },
						toggleControl
					)
				)
			);
		}

		return '';
	};

	/**
	 * Filters blocks' save function.
	 *
	 * @param {Object} element Element.
	 * @param {string} blockType Block type.
	 * @param {Object} attributes Attributes.
	 * @return {*} Output element.
	 */
	component.filterBlocksSave = function filterBlocksSave( element, blockType, attributes ) {
		var text,
			fitTextProps = {
				layout: 'fixed-height',
				children: element
			};

		if ( 'core/shortcode' === blockType.name && component.isGalleryShortcode( attributes ) ) {
			if ( attributes.ampCarousel ) {
				// If the text contains amp-carousel, lets remove it.
				if ( component.hasGalleryShortcodeCarouselAttribute( attributes.text || '' ) ) {
					text = component.removeAmpCarouselFromShortcodeAtts( attributes.text );

					return wp.element.createElement(
						wp.element.RawHTML,
						{},
						text
					);
				}

				// Else lets return original.
				return element;
			}

			// If the text already contains amp-carousel, return original.
			if ( component.hasGalleryShortcodeCarouselAttribute( attributes.text || '' ) ) {
				return element;
			}

			// Add amp-carousel=false attribut to the shortcode.
			text = attributes.text.replace( '[gallery', '[gallery amp-carousel=false' );

			return wp.element.createElement(
				wp.element.RawHTML,
				{},
				text
			);
		} else if ( -1 !== component.data.textBlocks.indexOf( blockType.name ) && attributes.ampFitText ) {
			if ( attributes.minFont ) {
				fitTextProps[ 'min-font-size' ] = attributes.minFont;
			}
			if ( attributes.maxFont ) {
				fitTextProps[ 'max-font-size' ] = attributes.maxFont;
			}
			if ( attributes.height ) {
				fitTextProps.height = attributes.height;
			}
			return wp.element.createElement( 'amp-fit-text', fitTextProps );
		}
		return element;
	};

	/**
	 * Check if AMP NoLoading is set.
	 *
	 * @param {Object} attributes Attributes.
	 * @return {boolean} If is set.
	 */
	component.hasAmpNoLoadingSet = function hasAmpNoLoadingSet( attributes ) {
		return attributes.ampNoLoading && false !== attributes.ampNoLoading;
	};

	/**
	 * Check if AMP Layout is set.
	 *
	 * @param {Object} attributes Attributes.
	 * @return {boolean} If AMP Layout is set.
	 */
	component.hasAmpLayoutSet = function hasAmpLayoutSet( attributes ) {
		return attributes.ampLayout && attributes.ampLayout.length;
	};

	/**
	 * Removes amp-carousel=false from attributes.
	 *
	 * @param {string} shortcode Shortcode text.
	 * @return {string} Modified shortcode.
	 */
	component.removeAmpCarouselFromShortcodeAtts = function removeAmpCarouselFromShortcodeAtts( shortcode ) {
		return shortcode.replace( ' amp-carousel=false', '' );
	};

	/**
	 * Check if shortcode includes amp-carousel attribute.
	 *
	 * @param {string} text Shortcode.
	 * @return {boolean} If has amp-carousel.
	 */
	component.hasGalleryShortcodeCarouselAttribute = function galleryShortcodeHasCarouselAttribute( text ) {
		return -1 !== text.indexOf( 'amp-carousel=false' );
	};

	/**
	 * Check if shortcode is gallery shortcode.
	 *
	 * @param {Object} attributes Attributes.
	 * @return {boolean} If is gallery shortcode.
	 */
	component.isGalleryShortcode = function isGalleryShortcode( attributes ) {
		return attributes.text && -1 !== attributes.text.indexOf( 'gallery' );
	};

	return component;
}() );
