/*

WriteDivideIntoTwo.js: Write image as 2 separate images bisected vertically

================================================================================
Copyright: Gowri Visweswaran 2022
================================================================================
 *
 * Parameters: the active image window
 *
 * On sucess, this routine creates 2 new tiff image files at the specified path.
 * On error, an Error exception is thrown. Detailed information is written to
 * the console.
 * The output path is saved in a Settings object for subsequent use
 *    key == TITLE
 *
*/

#feature-id    Utilities > WriteDivideIntoTwo
#feature-info  "<p>Write image as 2 separate images bisected vertically.</p>"

#define TITLE  "WriteDivideIntoTwo"
#define VERSION "1.0.0"

#include <pjsr/DataType.jsh>
#include <pjsr/UndoFlag.jsh>

#include <pjsr/Color.jsh>
#include <pjsr/StdButton.jsh>
#include <pjsr/FrameStyle.jsh>
#include <pjsr/TextAlign.jsh>
#include <pjsr/NumericControl.jsh>
#include <pjsr/UndoFlag.jsh>
#include <pjsr/SampleType.jsh>


#define TITLE "Combine Luminance and RGB to linear LRGB"
#define VERSION "2.0.0"
#define FontFamily_TypeWriter 4
#define FontFamily_Courier FontFamily_TypeWriter
#define StdCursor_Wait 16
#define StdCursor_Arrow 1
#define StdCursor_ArrowQuestion 17

// Shadows clipping point in (normalized) MAD units from the median.
#define DEFAULT_AUTOSTRETCH_SCLIP  -2.80
// Target mean background in the [0,1] range.
#define DEFAULT_AUTOSTRETCH_TBGND   0.25
#define DEFAULT_AUTOSTRETCH_CLINK   true

function generateDialog()
{
   // Add all properties and methods of the core Dialog object to this object.
   this.__base__ = Dialog;
   this.__base__();

   var dlg = this;

   var labelWidth1 = this.font.width( "Write image as 2 separate images bisected vertically." );

   this.lblHeadLine = new Label(this)
   this.lblHeadLine.useRichText = true;
   this.lblHeadLine.text ="<b> Write image as 2 separate images bisected vertically.</b>";


   this.lblCopyright = new Label(this)
   this.lblCopyright.text      = "© Gowri Visweswaran 2022";

   // ------------------------------------------------------------------------
   //
   // execute button
   //
   // ------------------------------------------------------------------------

   this.execButton = new PushButton( this );
   with ( this.execButton ) {
      text = "Combine";
      enabled = true;
      onPress = function()
      {
         Console.writeln("creating the 2 images...");

         dlg.cursor = new Cursor(StdCursor_Wait);

  	 var window = ImageWindow.activeWindow;

   	if ( window.isNull )
   	{
    	  Console.show();
    	  Console.writeln("\n<b>Error:</b> No active image.");
   	}
   	else
   	{
      	WriteTwo();
  	 }
        dlg.cursor = new Cursor(StdCursor_Arrow);
        dlg.done(0);
      }
   }


   this.buttonSizer = new HorizontalSizer;
   with ( this.buttonSizer )
   {
      spacing = 4;
      add( this.execButton );
   }

   this.sizer = new VerticalSizer;
   this.sizer.margin = 6;
   this.sizer.spacing = 6;
   this.sizer.add( this.lblHeadLine );
   this.sizer.add( this.lblCopyright );
   this.sizer.add( this.execButton  );
   this.windowTitle = "GenerateFromCorners";
   this.adjustToContents();

};




function WriteTwo()
{
/* ----------------------------------------------------------------------------
   Extensions to the String object
   ----------------------------------------------------------------------------
   Returns true if this string ends with the specified substring.
*/
   if ( !String.prototype.endsWith )
   String.prototype.endsWith = function( s )
   {
      var pos = this.lastIndexOf( s );
      return pos >= 0 && pos == this.length - s.length;
   };

// end extension

   var tiff_filename = ImageWindow.activeWindow.currentView.id;

   var currentPath = File.extractDirectory( ImageWindow.activeWindow.filePath);

   try
   {
      var temp;
      temp = Settings.read (TITLE , DataType_String);
      if (Settings.lastReadOK) {currentPath = temp;}
   }
   catch (x)
   {
      Console.writeln( x );
   }

   var sfdlg = new SaveFileDialog;
   with ( sfdlg )
   {
      caption = "Save " + tiff_filename + " as TIFF";

      initialPath = currentPath;

      if ( !( initialPath.endsWith( '/' )))
         {
            initialPath += '/';
         }

      initialPath += tiff_filename + ".tiff";

      selectedFileExtension = ".tiff";
      overwritePrompt = true;
      filters = [["TIFF Files", "*.tiff"]];
      if ( execute() )
      {
         tiff_filename = sfdlg.fileName;
         var tiff_filename_noext = tiff_filename.substring(0, tiff_filename.length - 5);
         Console.writeln( "<end/><cbr/><br/><b>==> File to write to: " + tiff_filename_noext + "</b>" );
         try
         {
            // obtain the original image
            var img = ImageWindow.activeWindow.currentView.image;
            var id  = ImageWindow.activeWindow.currentView.id;
            var temp_win = new ImageWindow(img.width,
                                           img.height,
                                           img.numberOfChannels,
                                           img.bitsPerSample,
                                           img.isReal,
                                           img.isColor);

            var view = temp_win.mainView;

            var temp_win1 = new ImageWindow(img.width/2,
                                           img.height,
                                           img.numberOfChannels,
                                           img.bitsPerSample,
                                           img.isReal,
                                           img.isColor);

            var view1 = temp_win1.mainView;
            view1.beginProcess( UndoFlag_NoSwapFile );
            view1.image.apply(ImageWindow.activeWindow.createPreview(0, 0, img.width/2, img.height).image);
            view1.endProcess();

            var fileFormat = new FileFormat( ".tiff", false/*toRead*/, true/*toWrite*/ );

            if ( fileFormat.isNull )
               throw new Error( "No installed file format can write .tiff files." );
            var file = new FileFormatInstance( fileFormat );

            if ( file.isNull )
               throw new Error( "Unable to instantiate file format: " + fileFormat.name );

            if ( !file.create( tiff_filename_noext + "_left.tiff", format( "quality %d", 100 ) ) )
               throw new Error( "Error creating file: " + tiff_filename_noext + "_left.tiff");

            if ( !file.writeImage( view1.image ) )
               throw new Error( "Error writing file: " + tiff_filename_noext + "_left.tiff");

            file.close();

            Console.writeln( "<end/><cbr/><br/><b>==> File written: " + tiff_filename_noext + "_left.tiff" + "</b>" );

            var finf = new FileInfo(tiff_filename_noext+ "_left.tiff" );

            if (!(finf.directory == currentPath))
            {
               Settings.write ( TITLE , DataType_String, finf.directory);
            }

            temp_win1.forceClose();

            var temp_win2 = new ImageWindow(img.width/2,
                                           img.height,
                                           img.numberOfChannels,
                                           img.bitsPerSample,
                                           img.isReal,
                                           img.isColor);

            var view2 = temp_win2.mainView;
            view2.beginProcess( UndoFlag_NoSwapFile );
            view2.image.apply(ImageWindow.activeWindow.createPreview(img.width/2, 0, img.width, img.height).image);
            view2.endProcess();

            var fileFormat = new FileFormat( ".tiff", false/*toRead*/, true/*toWrite*/ );

            if ( fileFormat.isNull )
               throw new Error( "No installed file format can write .tiff files." );
            var file2 = new FileFormatInstance( fileFormat );

            if ( file2.isNull )
               throw new Error( "Unable to instantiate file format: " + fileFormat.name );

            if ( !file2.create( tiff_filename_noext + "_right.tiff", format( "quality %d", 100 ) ) )
               throw new Error( "Error creating file: " + tiff_filename_noext + "_right.tiff");

            if ( !file2.writeImage( view2.image ) )
               throw new Error( "Error writing file: " + tiff_filename_noext + "_right.tiff");

            file2.close();

            Console.writeln( "<end/><cbr/><br/><b>==> File written: " + tiff_filename_noext + "_right.tiff" + "</b>" );

            var finf = new FileInfo(tiff_filename_noext + "_right.tiff" );

            if (!(finf.directory == currentPath))
            {
               Settings.write ( TITLE , DataType_String, finf.directory);
            }

            temp_win2.forceClose();

          }
         catch ( x )
         {
            throw x;
         }
         return true;
      }
      return false;
   }
};  // Write4


// diagnostic help

function PrintMat(stf)
{
   Console.writeln("STF");
   for (var y = 0; y < stf.length; y++)
   {
      var stfElement = stf[y];
      for (var x = 0; x < stfElement.length; x++)
      {
         Console.write(stfElement[x].toFixed(8) + '\t');
      }
   Console.writeln("");
   }
}


generateDialog.prototype = new Dialog;

//////////////////////////////////////////////////////////////////////////////
//
// Main script entry point
//
function main()
{
   Console.hide();
   var dialog = new generateDialog();
   dialog.execute();
}

main();
