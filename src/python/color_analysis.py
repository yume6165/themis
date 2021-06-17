#codeing:utf-8
# -*- coding: utf-8 -*-

import os, sys, time
import cv2 as cv
from PIL import Image
import numpy as np
np.set_printoptions(threshold=np.inf)
import pandas as pd
import math
import cmath
import matplotlib.pyplot as plt
import glob
from statistics import mean, stdev
import seaborn as sns
import csv
import collections as cl
import copy


def Lambert(img_path):
    #画像の読み込み
    img = np.array(Image.open(img_path))
    #cv.imshow("sample",cv.cvtColor(img, cv.COLOR_BGR2RGB))
    #cv.waitKey(0)
    img_Lab = cv.cvtColor(img, cv.COLOR_BGR2Lab)
    img_hsv = cv.cvtColor(img, cv.COLOR_BGR2HSV_FULL)

    img_L, img_a, img_b = cv.split(img_Lab)
    #print(img_Lab)

    #任意の健全な肌を探す # Hが40以下　Sが50以下　Vが200以上 その平均
    health_h = 0
    health_s = 0
    health_v = 0
    counter = 0
    for pixel_row in img_hsv:
        for pixel in pixel_row:
            if(pixel[0] <= 40 and pixel[1] <= 50 and pixel[2] >= 200):
                #print(pixel)
                health_h += pixel[0]
                health_s += pixel[1]
                health_v += pixel[2]
                counter += 1
    health_h = math.floor(health_h / counter)
    health_s = math.floor(health_s / counter)
    health_v = math.floor(health_v / counter)

    #健康な肌のピクセル画像を作成
    health_pixel = np.zeros((1, 1, 3), np.uint8)
    health_pixel[:, :, 0] = health_h
    health_pixel[:, :, 1] = health_s
    health_pixel[:, :, 2] = health_v
    health_pixel = cv.cvtColor(health_pixel, cv.COLOR_HSV2BGR_FULL)
    #print(health_pixel)[[[229 230 235]]]

    #Lambert-Beerにしたがって方程式を解く
    A = np.matrix([[0.111, 0.021, -1],[0.278, 0.628, -1],[0.609, 0.369, -1]])
    count_x = 0
    count_y = 0
    for pixel_row in img:
        #print(len(img.tolist()))
        if(count_y >= len(img.tolist())):break

        count_x = 0
        for pixel in pixel_row:
            y_r = 0
            y_g = 0
            y_b = 0
            Y = []

            if(count_x == len(pixel_row.tolist())):break
            if((pixel[2] / health_pixel[0][0][2]) == 0 or (pixel[1] / health_pixel[0][0][1]) == 0 or (pixel[0] / health_pixel[0][0][0]) == 0):
                continue
            y_r = math.log10(pixel[2] / health_pixel[0][0][2])
            y_g = math.log10(pixel[1] / health_pixel[0][0][1])
            y_b = math.log10(pixel[0] / health_pixel[0][0][0])
            Y.append(y_r)
            Y.append(y_g)
            Y.append(y_b)

            result = np.linalg.solve(A,Y)
            #print(result)
            if(result[0] < 0 and result[1] < 0 and (img_hsv[count_y][count_x][0] <= 30 or 150 <= img_hsv[count_y][count_x][0] or img_hsv[count_y][count_x][0] <= 179)):
                cv.drawMarker(img, (count_x, count_y), (0, 0, 255), markerType=cv.MARKER_STAR, markerSize=10)
                #print(str(count_x) + (", ") + str(count_y))

            count_x += 1

        count_y += 1

    #cv.imshow("sample",cv.cvtColor(img, cv.COLOR_BGR2RGB))
    #cv.waitKey(0)




if __name__ == '__main__':
    path = "/Users/asayamayume/Desktop/themis/public/results/original_img/ori_img_0.jpg"
    Lambert(path)
