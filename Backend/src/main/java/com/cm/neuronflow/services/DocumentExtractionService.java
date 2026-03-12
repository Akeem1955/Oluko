// FILE: .\src\main\java\com\cm\neuronflow\services\DocumentExtractionService.java
package com.cm.neuronflow.services;

import com.cm.neuronflow.internal.exceptions.NeuronFlowException;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.tika.metadata.Metadata;
import org.apache.tika.parser.AutoDetectParser;
import org.apache.tika.parser.ParseContext;
import org.apache.tika.parser.mp4.MP4Parser;
import org.apache.tika.sax.BodyContentHandler;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
// Add this inside DocumentExtractionService.java
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;

import java.io.ByteArrayInputStream;
import java.io.InputStream;

@Service
@Slf4j
public class DocumentExtractionService {

    public String extractTextFromBytes(byte[] fileBytes) {
        log.info("Starting document text extraction via Apache Tika");
        try (InputStream stream = new ByteArrayInputStream(fileBytes)) {
            // -1 removes the character limit so Tika reads the entire document
            BodyContentHandler handler = new BodyContentHandler(-1);
            Metadata metadata = new Metadata();
            AutoDetectParser parser = new AutoDetectParser();
            ParseContext context = new ParseContext();

            parser.parse(stream, handler, metadata, context);

            String extractedText = handler.toString().trim();
            if (extractedText.isEmpty()) {
                throw new NeuronFlowException("Extracted document is empty.", HttpStatus.BAD_REQUEST);
            }
            return extractedText;

        } catch (NeuronFlowException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to extract text from document: {}", e.getMessage(), e);
            throw new NeuronFlowException("Failed to extract text from document: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    public String extractVideoTranscriptFromBytes(byte[] fileBytes) {
        log.info("Starting video transcript extraction via Apache Tika MP4Parser");
        try (InputStream stream = new ByteArrayInputStream(fileBytes)) {
            BodyContentHandler handler = new BodyContentHandler(-1);
            Metadata metadata = new Metadata();

            // Explicitly use MP4Parser to target video containers for embedded text/subtitles
            MP4Parser parser = new MP4Parser();
            ParseContext context = new ParseContext();

            parser.parse(stream, handler, metadata, context);

            String extractedText = handler.toString().trim();

            // If Tika only finds video metadata but no actual subtitle/transcript text
            if (extractedText.isEmpty() || extractedText.length() < 20) {
                log.warn("Video extraction yielded insufficient text (Length: {}). No embedded subtitles found.", extractedText.length());
                throw new NeuronFlowException("No embedded transcript or subtitles found in the uploaded video.", HttpStatus.BAD_REQUEST);
            }

            log.info("Successfully extracted video transcript. Length: {} characters", extractedText.length());
            return extractedText;

        } catch (NeuronFlowException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to parse video file: {}", e.getMessage(), e);
            throw new NeuronFlowException("Failed to extract transcript from video: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }


    public String extractSpecificPagesFromPdf(byte[] fileBytes, int startPage, int endPage) {
        log.info("Extracting text from PDF pages {} to {}", startPage, endPage);
        try (PDDocument document = Loader.loadPDF(fileBytes)) {
            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setStartPage(startPage);
            stripper.setEndPage(endPage);

            String extractedText = stripper.getText(document).trim();
            if (extractedText.isEmpty()) {
                throw new NeuronFlowException("No text found on the specified pages.", HttpStatus.BAD_REQUEST);
            }
            return extractedText;
        } catch (Exception e) {
            log.error("Failed to extract pages from PDF: {}", e.getMessage(), e);
            throw new NeuronFlowException("Failed to extract specific pages: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}