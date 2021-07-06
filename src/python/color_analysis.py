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
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
from mpl_toolkits.mplot3d import Axes3D


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



def Kmeans(img):
    x = img.shape[0]
    y = img.shape[1]


    img = cv.cvtColor(img, cv.COLOR_BGR2HSV)
    area = x * y


    sorted_img = []
    count_x = 0
    count_y = 0
    count_r = 0
    count_g = 0
    count_b = 0
    r_array = []
    g_array = []
    b_array = []
    r_pixel_pos = []
    g_pixel_pos = []
    b_pixel_pos = []
    #print(area)
    #print(np.array(r_array).shape)

    for pixel_row in img:
        if(count_y >= len(img.tolist())):break

        count_x = 0
        for pixel in pixel_row:
            if(pixel[0] < 30 or 150 <= pixel[0] and pixel[0] < 179):#赤色の時
                r_array.append(pixel)
                r_pixel_pos.append([count_x, count_y])
                count_r += 1

            elif(30 <= pixel[0] and pixel[0] < 90):#緑色の時
                g_array.append(pixel)
                g_pixel_pos.append([count_x, count_y])
                count_g += 1

            elif(90 <= pixel[0] and pixel[0] < 150):#青の時
                b_array.append(pixel)
                b_pixel_pos.append([count_x, count_y])
                count_b += 1

            count_x += 1

        count_y += 1

    sorted_img.append(r_array)
    sorted_img.append(g_array)
    sorted_img.append(b_array)

    #print(len(r_array))
    #print(len(g_array))
    #print(len(b_array))

    #真っ白な画像を作る
    white_img = np.ones((300, 600, 3), np.uint8)
    white_img = cv.cvtColor(white_img, cv.COLOR_BGR2HSV)

    count_x = 0
    count_y = 0
    for channel in sorted_img:
        count_x = 0
        tmp1 = 100 * count_y

        for color in channel:#とりあえず100並べる
            tmp2 = count_x * 1
            #print(color)
            cv.rectangle(white_img, (tmp2, tmp1), (tmp2 + 1, tmp1 + 100), (int(color[0]), int(color[1]), int(color[2])), thickness=-1)
            count_x += 1

        count_y += 1

    #cv.imshow("sample",cv.cvtColor(white_img, cv.COLOR_HSV2RGB))
    #cv.waitKey(0)

    #ここからkmeans法　赤の範囲のみに適用 なぜかbチャンネルが創傷入ってるクラスター
    cust_array = np.array(b_array)
    pred = KMeans(n_clusters=3).fit_predict(cust_array)
    #print(pred)

    img = cv.cvtColor(img, cv.COLOR_HSV2BGR)

    cluster_count = 0
    mean0 = [0, 0, 0]
    mean1 = [0, 0, 0]
    mean2 = [0, 0, 0]

    counter_mean0 = 0
    counter_mean1 = 0
    counter_mean2 = 0

    cluster_list = [[], [], []]#クラスターが三なので３次元リスト作成


    for cluster in pred:
        if(cluster == 0):
            cv.drawMarker(img, (b_pixel_pos[cluster_count][0], b_pixel_pos[cluster_count][1]), (0, 255, 0), markerType=cv.MARKER_TILTED_CROSS, markerSize=15)
            mean0[0] += b_array[cluster_count][0]
            mean0[1] += b_array[cluster_count][1]
            mean0[2] += b_array[cluster_count][2]
            cluster_list[0].append(hsv2lab(b_array[cluster_count]))
            counter_mean0 += 1

        elif(cluster == 1):
            cv.drawMarker(img, (b_pixel_pos[cluster_count][0], b_pixel_pos[cluster_count][1]), (255, 0, 0), markerType=cv.MARKER_TILTED_CROSS, markerSize=15)
            mean1[0] += b_array[cluster_count][0]
            mean1[1] += b_array[cluster_count][1]
            mean1[2] += b_array[cluster_count][2]
            cluster_list[1].append(hsv2lab(b_array[cluster_count]))
            counter_mean1 += 1

        elif(cluster == 2):

            cv.drawMarker(img, (b_pixel_pos[cluster_count][0], b_pixel_pos[cluster_count][1]), (0, 0, 255), markerType=cv.MARKER_TILTED_CROSS, markerSize=15)
            mean2[0] += b_array[cluster_count][0]
            mean2[1] += b_array[cluster_count][1]
            mean2[2] += b_array[cluster_count][2]
            cluster_list[2].append(hsv2lab(b_array[cluster_count]))
            counter_mean2 += 1

        cluster_count += 1

    means = []
    mean0[1] /= counter_mean0
    mean1[1] /= counter_mean1
    mean2[1] /= counter_mean2
    means.append(mean0[1])
    means.append(mean1[1])
    means.append(mean2[1])

    #彩度がもっとも高いクラスタを創傷クラスタとして、代表色決定 meanはHSV
    wound_cluster = means.index(max(means))
    rep_color = []
    if(wound_cluster == 0):
        mean0[0] /= counter_mean0
        mean0[2] /= counter_mean0

        mean0[0] = math.floor(mean0[0])
        mean0[1] = math.floor(mean0[1])
        mean0[2] = math.floor(mean0[2])
        rep_color = hsv2lab(mean0)

    elif(wound_cluster == 1):
        mean1[0] /= counter_mean1
        mean1[2] /= counter_mean1

        mean1[0] = math.floor(mean1[0])
        mean1[1] = math.floor(mean1[1])
        mean1[2] = math.floor(mean1[2])
        rep_color = hsv2lab(mean1)

    elif(wound_cluster == 2):
        mean2[0] /= counter_mean2
        mean2[2] /= counter_mean2

        mean2[0] = math.floor(mean2[0])
        mean2[1] = math.floor(mean2[1])
        mean2[2] = math.floor(mean2[2])
        rep_color = hsv2lab(mean2)

    #主成分分析
    pca_array = np.array(cluster_list[wound_cluster])
    pca = PCA()
    pca.fit(pca_array)
    transformed = pca.fit_transform(pca_array)

    #print(transformed)

    #fig = plt.figure()
    #ax = Axes3D(fig)
    #ax.set_xlabel("PCA1")
    #ax.set_ylabel("PCA2")
    #ax.set_zlabel("PCA3")
    #for plot in transformed:
    #    ax.plot(plot[0], plot[1], plot[2],marker="o",linestyle='None')#色なんとか変えたい

    #plt.show()
    dfc = pd.DataFrame(pca_array).corr()
    eig_val, eig_vec =np.linalg.eig(dfc)
    eig_vec_pc1 = eig_vec[:, 0]
    dist = eig_val[0]


    return rep_color, eig_vec_pc1, dist
    #cv.imshow("sample",img)
    #cv.waitKey(0)


def hsv2lab(color):
    #print(type(color))
    tmp_pixel = np.zeros((1, 1, 3), np.uint8)
    tmp_pixel[:, :, 0] = color[0]
    tmp_pixel[:, :, 1] = color[1]
    tmp_pixel[:, :, 2] = color[2]
    tmp_pixel = cv.cvtColor(tmp_pixel, cv.COLOR_HSV2BGR)
    tmp_pixel = cv.cvtColor(tmp_pixel, cv.COLOR_BGR2Lab)

    color[0] = tmp_pixel[0][0][0]
    color[1] = tmp_pixel[0][0][1]
    color[2] = tmp_pixel[0][0][2]

    return color






if __name__ == '__main__':
    path = "/Users/asayamayume/Desktop/themis/public/results/original_img/ori_img_0.jpg"
    #Lambert(path)
    img = np.array(Image.open(path))
    print(Kmeans(img))
