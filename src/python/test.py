#codeing:utf-8
# -*- coding: utf-8 -*-

import os, sys, time
import cv2 as cv
from PIL import Image
import numpy as np
np.set_printoptions(threshold=np.inf)
import pandas as pd
import matplotlib.pyplot as plt
import math
import cmath
import glob
from statistics import mean, stdev
import csv
import collections as cl
import copy

def compute_Lambert(health, target):
    #Lambert-Beerにしたがって方程式を解く
    A = np.matrix([[0.111, 0.013, -1],[0.278, 0.591, -1],[0.609, 0.397, -1]])
    Y = []

    if((target[2] / health[2]) == 0 or (target[1] / health[1]) == 0 or (target[0] / health[0]) == 0):
        return 0
    y_r = math.log10(target[0] / health[0])
    y_g = math.log10(target[1] / health[1])
    y_b = math.log10(target[2] / health[2])
    Y.append(y_r)
    Y.append(y_g)
    Y.append(y_b)

    result = np.linalg.solve(A,Y)
    print(result)



if __name__ == '__main__':
    health = np.array([180, 157, 142])#rgb
    target = np.array([83, 13, 18])#rgb
    compute_Lambert(health, target)
