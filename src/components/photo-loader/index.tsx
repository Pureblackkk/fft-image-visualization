import { useState, useEffect } from "react";
import { GlobalEventName } from "@/src/global/global-defination";
import { Eventer } from "@/src/utils/eventer";

import './index.css';

// Filer loader handler
const handleFile = (event: any) => {
    const files: any = event.target?.files;

    // No files exit
    if (!files) {
        return;
    }

    // Initial file reader
    const reader = new FileReader();
    
    reader.onload = (event: any) => {
        // Extract fileURL for sent 
        const fileURL = event.target.result;

        // Dispatch event
        Eventer.dispatchEvent(GlobalEventName.ParseImage, fileURL);
    }

    reader.readAsDataURL(files[0]);
}

const PhotoLoader = () => {
    // Add input file event listener
    useEffect(() => {
        const filerInputer: HTMLElement | null = document.getElementById('imgFile');
        if (filerInputer == null) {
            return;
        }

        filerInputer.addEventListener('change', (event) => {
            handleFile(event);
        });

        return () => {
            filerInputer.removeEventListener('change', handleFile);
        }
    }, []);

    return (
        <div className="uploader-wrap">
            <label htmlFor="imgFile" className="uploader-icon">
            </label>
            <input className="uploader" type="file" id="imgFile" accept="image/*"/>
        </div>
    );
}

export default PhotoLoader;
