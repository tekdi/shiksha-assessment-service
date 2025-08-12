import { Injectable, Logger } from '@nestjs/common';
import { Client } from '@elastic/elasticsearch';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TestAttempt } from '../modules/tests/entities/test-attempt.entity';
import { isElasticsearchEnabled } from '../common/utils/elasticsearch.util';
import axios from 'axios';



// Define the shared config locally to avoid import path issues
const SHARED_ELASTICSEARCH_CONFIG = {
  indexName: 'users',
  node: process.env.ELASTICSEARCH_HOST || 'http://localhost:9200',
};

@Injectable()
export class AssessmentElasticsearchService {
  private readonly indexName = SHARED_ELASTICSEARCH_CONFIG.indexName;
  private readonly client: Client;
  private readonly logger = new Logger(AssessmentElasticsearchService.name);
  private readonly userMicroserviceUrl: string;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(TestAttempt)
    private readonly testAttemptRepository: Repository<TestAttempt>,
  ) {
    this.client = new Client({
      node: process.env.ELASTICSEARCH_HOST || SHARED_ELASTICSEARCH_CONFIG.node
    });
    this.userMicroserviceUrl = this.configService.get<string>('USER_MICROSERVICE_URL', 'http://localhost:3002');
  }

  /**
   * Check if user document exists in Elasticsearch
   */
  async checkUserDocumentExists(userId: string): Promise<boolean> {
    if (!isElasticsearchEnabled()) {
      this.logger.debug('Elasticsearch is disabled, returning false for user document check');
      return false;
    }

    try {
      const exists = await this.client.exists({
        index: this.indexName,
        id: userId
      });
      return exists;
    } catch (error) {
      this.logger.error(`Error checking if user document exists for userId: ${userId}:`, error);
      return false;
    }
  }

  /**
   * Check if user has complete courses data in Elasticsearch
   */
  async checkUserHasCompleteCourses(userId: string): Promise<boolean> {
    try {
      const response = await this.client.get({
          index: this.indexName,
        id: userId
      });

      const userData = response._source as any;
      
      // Check if applications exist and have courses data
      if (!userData.applications || !Array.isArray(userData.applications)) {
        return false;
      }

      // Check if any application has courses with values
      for (const application of userData.applications) {
        if (application.courses && 
            application.courses.values && 
            Array.isArray(application.courses.values) && 
            application.courses.values.length > 0) {
          return true;
        }
      }

      return false;
    } catch (error) {
      this.logger.error(`Error checking if user has complete courses for userId: ${userId}:`, error);
      return false;
    }
  }

  /**
   * Get user from Elasticsearch using direct ID lookup
   */
  async getUserFromElasticsearch(userId: string): Promise<any> {
    try {
      const response = await this.client.get({
        index: this.indexName,
        id: userId
      });
      return response._source;
    } catch (error) {
      this.logger.error(`Error getting user from Elasticsearch for userId: ${userId}:`, error);
      return null;
    }
  }

  /**
   * Force sync user from user microservice
   */
  private async forceSyncUserFromMicroservice(userId: string): Promise<void> {
    try {
      this.logger.log(`🔄 Force syncing user ${userId} from user microservice...`);
      
      const headers: any = {
        'Content-Type': 'application/json'
      };

      const response = await axios.post(
        `${this.userMicroserviceUrl}/user/v1/elasticsearch/users/${userId}/sync`,
        {},
        { headers }
      );
console.log("***********forceSync",response);

      if (response.status === 200) {
        this.logger.log(`✅ Successfully force synced user ${userId} from user microservice`);
      } else {
        this.logger.warn(`⚠️ Force sync response status: ${response.status} for user ${userId}`);
      }
    } catch (error) {
      this.logger.error(`❌ Failed to force sync user ${userId} from user microservice:`, error);
      // Don't throw error, continue with the operation
    }
  }

  /**
   * Map testId to lessonId using LMS service API
   * Returns full lesson info: { courseId, moduleId, lessonId }
   */
  private async mapTestIdToLessonId(
    testId: string,
    tenantId?: string,
    organisationId?: string,
    userId?: string
  ): Promise<{ courseId: string; moduleId: string; lessonId: string } | null> {
    try {
      this.logger.log(`🔄 Mapping testId ${testId} to lessonId through LMS service`);
      this.logger.log(`🏢 Tenant ID: ${tenantId || 'NOT PROVIDED'}`);
      this.logger.log(`🏛️ Organisation ID: ${organisationId || 'NOT PROVIDED'}`);
      
      const lmsServiceUrl = this.configService.get<string>('LMS_SERVICE_URL') || 'http://localhost:4002';
      this.logger.log(`🌐 LMS Service URL: ${lmsServiceUrl}`);
      
      // Use the user-specific endpoint to prevent multiple user syncing
      const url = userId 
        ? `${lmsServiceUrl}/lms-service/v1/lessons/test/${testId}?userId=${userId}`
        : `${lmsServiceUrl}/lms-service/v1/lessons/test/${testId}`;
      
      if (userId) {
        this.logger.log(`🔒 USING USER-SPECIFIC ENDPOINT (prevents multiple user syncing)`);
        this.logger.log(`👤 User ID: ${userId}`);
      } else {
        this.logger.warn(`⚠️ WARNING: Using generic endpoint (may trigger multiple user syncing)`);
        this.logger.warn(`⚠️ This should not happen in normal operation`);
      }
      
      this.logger.log(`🔗 Making API call to: ${url}`);
      console.log("***********",url);
      
      // Build headers with required tenant and organisation IDs
      const headers: any = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'AssessmentService/1.0'
      };
      
      // Add required headers if provided
      if (tenantId) {
        headers['tenantid'] = tenantId;
      }
      if (organisationId) {
        headers['organisationid'] = organisationId;
      }
      
      // Log the exact curl command for manual testing
      this.logger.log(`📋 MANUAL TEST CURL COMMAND:`);
      if (userId) {
        this.logger.log(`📋 curl -X GET "${url}" -H "Content-Type: application/json" -H "tenantid: ${tenantId || 'YOUR_TENANT_ID'}" -H "organisationid: ${organisationId || 'YOUR_ORGANISATION_ID'}" -v`);
        this.logger.log(`📋 Note: Using user-specific endpoint with userId: ${userId} to prevent multiple user syncing`);
      } else {
        this.logger.log(`📋 curl -X GET "${url}" -H "Content-Type: application/json" -H "tenantid: ${tenantId || 'YOUR_TENANT_ID'}" -H "organisationid: ${organisationId || 'YOUR_ORGANISATION_ID'}" -v`);
        this.logger.log(`📋 Note: Using generic endpoint (may trigger multiple user syncing)`);
      }
      
      this.logger.log(`📋 Request Headers: ${JSON.stringify(headers, null, 2)}`);
      this.logger.log(`📋 Request Method: GET`);
      this.logger.log(`📋 Request URL: ${url}`);
      this.logger.log(`📋 Test ID being sent: ${testId}`);
      this.logger.log(`📋 Test ID type: ${typeof testId}`);
      this.logger.log(`📋 Test ID length: ${testId.length}`);
      
      const response = await axios.get(url, { headers });
      console.log("***********response",response);
      this.logger.log(`✅ API Call Successful!`);
      this.logger.log(`📊 Response Status: ${response.status}`);
      this.logger.log(`📊 Response Status Text: ${response.statusText}`);
      this.logger.log(`📊 Response Headers: ${JSON.stringify(response.headers, null, 2)}`);
      this.logger.log(`📊 Response Data: ${JSON.stringify(response.data, null, 2)}`);
      
      if (response.data && response.data.result) {
        const result = response.data.result;
        this.logger.log(`✅ Successfully found result for testId: ${testId}`);
        this.logger.log(`🔍 Result object keys: ${Object.keys(result).join(', ')}`);
        this.logger.log(`🔍 Result object: ${JSON.stringify(result, null, 2)}`);
        
        // Check if we have the required fields directly in result
        this.logger.log(`🔍 Checking required fields:`);
        this.logger.log(`🔍 - result.lessonId: ${result.lessonId} (type: ${typeof result.lessonId})`);
        this.logger.log(`🔍 - result.course: ${JSON.stringify(result.course)}`);
        this.logger.log(`🔍 - result.course?.courseId: ${result.course?.courseId} (type: ${typeof result.course?.courseId})`);
        this.logger.log(`🔍 - result.module: ${JSON.stringify(result.module)}`);
        this.logger.log(`🔍 - result.module?.moduleId: ${result.module?.moduleId} (type: ${typeof result.module?.moduleId})`);
        
        if (result.lessonId && result.course?.courseId && result.module?.moduleId) {
          this.logger.log(`✅ All required fields found!`);
          this.logger.log(`📍 Lesson ID: ${result.lessonId}`);
          this.logger.log(`📍 Course ID: ${result.course.courseId}`);
          this.logger.log(`📍 Module ID: ${result.module.moduleId}`);
          
          return {
            courseId: result.course.courseId,
            moduleId: result.module.moduleId,
            lessonId: result.lessonId
          };
        } else {
          this.logger.warn(`⚠️ Missing required fields in result data:`);
          this.logger.warn(`📍 lessonId: ${result.lessonId}`);
          this.logger.warn(`📍 course.courseId: ${result.course?.courseId}`);
          this.logger.warn(`⚠️ Response data: ${JSON.stringify(response.data, null, 2)}`);
          this.logger.warn(`⚠️ Response structure analysis:`);
          this.logger.warn(`⚠️ - Has response.data: ${!!response.data}`);
          this.logger.warn(`⚠️ - Has response.data.result: ${!!(response.data && response.data.result)}`);
          if (response.data) {
            this.logger.warn(`⚠️ - Available top-level keys: ${Object.keys(response.data).join(', ')}`);
            if (response.data.result) {
              this.logger.warn(`⚠️ - Available result keys: ${Object.keys(response.data.result).join(', ')}`);
            }
          }
          return null;
        }
      } else {
        this.logger.warn(`⚠️ No result found for testId ${testId} in LMS service, will use fallback`);
        this.logger.warn(`⚠️ Response data: ${JSON.stringify(response.data, null, 2)}`);
        this.logger.warn(`⚠️ Response structure analysis:`);
        this.logger.warn(`⚠️ - Has response.data: ${!!response.data}`);
        this.logger.warn(`⚠️ - Has response.data.result: ${!!(response.data && response.data.result)}`);
        if (response.data) {
          this.logger.warn(`⚠️ - Available top-level keys: ${Object.keys(response.data).join(', ')}`);
        }
      }
      return null;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        this.logger.warn(`⚠️ No lesson found for testId ${testId} in LMS service, will use fallback`);
        this.logger.warn(`⚠️ ${error.response.status} Response Status: ${error.response.status}`);
        this.logger.warn(`⚠️ ${error.response.status} Response Status Text: ${error.response.statusText}`);
        this.logger.warn(`⚠️ ${error.response.status} Response Headers: ${JSON.stringify(error.response.headers, null, 2)}`);
        this.logger.warn(`⚠️ ${error.response.status} Response Data: ${JSON.stringify(error.response.data, null, 2)}`);
        
        // Additional error analysis
        this.logger.warn(`⚠️ Error Analysis:`);
        this.logger.warn(`⚠️ - HTTP Status: ${error.response.status}`);
        this.logger.warn(`⚠️ - Error Code: ${error.response.data?.params?.err || 'UNKNOWN'}`);
        this.logger.warn(`⚠️ - Error Message: ${error.response.data?.params?.errmsg || 'UNKNOWN'}`);
        this.logger.warn(`⚠️ - API ID: ${error.response.data?.id || 'UNKNOWN'}`);
        this.logger.warn(`⚠️ - API Version: ${error.response.data?.ver || 'UNKNOWN'}`);
        
        // Log the exact curl command that failed
        this.logger.warn(`📋 FAILED CURL COMMAND (for debugging):`);
        if (userId) {
          this.logger.warn(`📋 curl -X GET "http://localhost:4002/lms-service/v1/lessons/test/${testId}?userId=${userId}" -H "Content-Type: application/json" -H "tenantid: ${tenantId || 'YOUR_TENANT_ID'}" -H "organisationid: ${organisationId || 'YOUR_ORGANISATION_ID'}" -v`);
          this.logger.warn(`📋 Note: Using user-specific endpoint with userId: ${userId} to prevent multiple user syncing`);
        } else {
          this.logger.warn(`📋 curl -X GET "http://localhost:4002/lms-service/v1/lessons/test/${testId}" -H "Content-Type: application/json" -H "tenantid: ${tenantId || 'YOUR_TENANT_ID'}" -H "organisationid: ${organisationId || 'YOUR_ORGANISATION_ID'}" -v`);
          this.logger.warn(`📋 Note: Using generic endpoint (may trigger multiple user syncing)`);
        }
      } else {
        this.logger.error(`❌ Error calling LMS service for testId ${testId}:`, error);
      }
      return null;
    }
  }

  /**
   * Get lesson info from testId using LMS service
   */
  private async getLessonInfoFromTestId(
    testId: string, 
    tenantId?: string, 
    organisationId?: string,
    userId?: string
  ): Promise<{ courseId: string; moduleId: string; lessonId: string } | null> {
    try {
      this.logger.log(`🔍 Getting lesson info for testId: ${testId}`);
      this.logger.log(`🏢 Tenant ID: ${tenantId || 'NOT PROVIDED'}`);
      this.logger.log(`🏛️ Organisation ID: ${organisationId || 'NOT PROVIDED'}`);
      this.logger.log(`👤 User ID: ${userId || 'NOT PROVIDED'}`);
      
      // Try LMS service first - ALWAYS include userId to prevent multiple user syncing
      const lessonInfo = await this.mapTestIdToLessonId(testId, tenantId, organisationId, userId);
      if (lessonInfo) {
        this.logger.log(`✅ Successfully got lesson info from LMS service:`, lessonInfo);
        return lessonInfo;
      }
      
      this.logger.warn(`⚠️ LMS service didn't return lesson info, will try fallback methods`);
      return null;
    } catch (error) {
      this.logger.error(`❌ Error getting lesson info from testId ${testId}:`, error);
      return null;
    }
  }

  /**
   * Step 1: Find course details for userId from LMS
   * This method fetches all course enrollments and their details for a specific user
   */
  private async findCourseDetailsForUser(userId: string, tenantId: string, organisationId: string): Promise<any[]> {
    try {
      this.logger.log(`🔄 Step 1: Finding course details for userId: ${userId} from LMS`);
      
      const lmsServiceUrl = this.configService.get<string>('LMS_SERVICE_URL') || 'http://localhost:4002';
      
      // Step 1.1: Get user enrollments to find course IDs
      this.logger.log(`🔄 Step 1.1: Fetching user enrollments for userId: ${userId}`);
      
      const enrollmentsUrl = `${lmsServiceUrl}/lms-service/v1/enrollments?learnerId=${userId}&status=published`;
      
      const enrollmentsHeaders = {
        'Content-Type': 'application/json',
        'tenantid': tenantId,
        'organisationid': organisationId
      };
      
      try {
        const enrollmentsResponse = await axios.get(enrollmentsUrl, { headers: enrollmentsHeaders });

        if (enrollmentsResponse.status !== 200 || !enrollmentsResponse.data) {
          this.logger.warn(`⚠️ No enrollments found for userId: ${userId}`);
          return [];
        }

        const enrollments = enrollmentsResponse.data.result?.enrollments || [];
        this.logger.log(`📊 Step 1.1: Found ${enrollments.length} enrollments for userId: ${userId}`);

        const courseDetails = [];

        // Step 1.2: For each enrollment, fetch complete course details with modules and lessons
        for (const enrollment of enrollments) {
          try {
            const courseId = enrollment.courseId;
            if (!courseId) {
              this.logger.warn(`⚠️ No courseId found in enrollment: ${JSON.stringify(enrollment)}`);
              continue;
            }

            this.logger.log(`🔄 Step 1.2: Fetching course hierarchy for courseId: ${courseId}`);
            
            const courseHierarchyUrl = `${lmsServiceUrl}/lms-service/v1/courses/${courseId}/hierarchy/tracking/${userId}?includeModules=true&includeLessons=true`;
            
            // Fetch complete course hierarchy with tracking data
            const courseHierarchyResponse = await axios.get(courseHierarchyUrl, { headers: enrollmentsHeaders });

            if (courseHierarchyResponse.status === 200 && courseHierarchyResponse.data) {
              const courseHierarchy = courseHierarchyResponse.data.result || courseHierarchyResponse.data;
              
              this.logger.log(`✅ Step 1.2: Successfully fetched course hierarchy for courseId: ${courseId}`);
              
              // Count total lessons across all modules
              const totalLessons = courseHierarchy.modules?.reduce((total, module) => {
                return total + (module.lessons?.length || 0);
              }, 0) || 0;
              
              this.logger.log(`📊 Course details: ${courseHierarchy.modules?.length || 0} modules, ${totalLessons} lessons`);
              
              courseDetails.push({
                enrollment: enrollment,
                courseHierarchy: courseHierarchy
              });
            } else {
              this.logger.warn(`⚠️ Failed to fetch course hierarchy for courseId: ${courseId}, status: ${courseHierarchyResponse.status}`);
            }
          } catch (error: any) {
            this.logger.warn(`⚠️ Failed to fetch course hierarchy for enrollment: ${enrollment.courseId}:`, error.message);
            // Continue with other enrollments
          }
        }

        this.logger.log(`✅ Step 1: Successfully found ${courseDetails.length} course details for userId: ${userId}`);
        
        // Log summary of what we found
        for (const courseDetail of courseDetails) {
          const course = courseDetail.courseHierarchy;
          const moduleCount = course.modules?.length || 0;
          const lessonCount = course.modules?.reduce((total, module) => total + (module.lessons?.length || 0), 0) || 0;
          this.logger.log(`📋 Course: ${course.title || course.name} (${course.courseId}) - ${moduleCount} modules, ${lessonCount} lessons`);
        }

        return courseDetails;
      } catch (enrollmentsError: any) {
        this.logger.error(`❌ Step 1.1: Failed to fetch enrollments for userId: ${userId}:`, enrollmentsError.message);
        return [];
      }
    } catch (error: any) {
      this.logger.error(`❌ Step 1: Failed to find course details for userId: ${userId}:`, error);
      return [];
    }
  }

  /**
   * Create comprehensive courses object for Elasticsearch from multiple course details
   */
  private createCoursesObjectForElasticsearch(courseDetails: any[]): any {
    this.logger.log(`🏗️ ===== STARTING COURSES OBJECT CREATION =====`);
    this.logger.log(`🏗️ Creating comprehensive courses object for ${courseDetails.length} courses`);
    this.logger.log(`🏗️ Course details array: ${JSON.stringify(courseDetails.map(cd => ({ courseId: cd.courseHierarchy.courseId, title: cd.courseHierarchy.title })))}`);
    
    const courses = {
      type: 'nested',
      values: []
    };

    for (const courseDetail of courseDetails) {
      const courseHierarchy = courseDetail.courseHierarchy;
      const enrollment = courseDetail.enrollment;
      
      this.logger.log(`📋 Processing course: ${courseHierarchy.title || courseHierarchy.name} (${courseHierarchy.courseId})`);
      
      const course = {
        courseTitle: courseHierarchy.title || courseHierarchy.name,
        progress: courseHierarchy.tracking?.progress || 0,
        units: {
          type: 'nested',
          values: []
        },
        courseId: courseHierarchy.courseId
      };

      // Transform modules to units (lessons are nested inside modules)
      if (courseHierarchy.modules && Array.isArray(courseHierarchy.modules)) {
        this.logger.log(`📦 Processing ${courseHierarchy.modules.length} modules for course: ${course.courseTitle}`);
        
        for (const module of courseHierarchy.modules) {
          const unit = {
            unitId: module.moduleId,
            unitTitle: module.title || module.name,
            progress: module.tracking?.progress || 0,
            contents: {
              type: 'nested',
              values: []
            }
          };

          // Transform lessons to contents
          if (module.lessons && Array.isArray(module.lessons)) {
            this.logger.log(`📚 Processing ${module.lessons.length} lessons for module: ${unit.unitTitle}`);
            
            for (const lesson of module.lessons) {
              const content = {
                contentId: lesson.lessonId,
                lessonId: lesson.lessonId,
                type: lesson.format || lesson.type || 'text_and_media',
                tracking: {
                  score: lesson.tracking?.score || null,
                  timeSpent: lesson.tracking?.timeSpent || 0,
                  progress: lesson.tracking?.completionPercentage || lesson.tracking?.progress || 0,
                  lastAccessed: lesson.tracking?.lastAccessed || lesson.tracking?.updatedAt || null,
                  attempt: lesson.tracking?.attempt?.attemptNumber || lesson.tracking?.attempt || 1,
                  status: lesson.tracking?.status || 'not_started'
                },
                status: lesson.tracking?.status || 'not_started'
              };

              unit.contents.values.push(content);
            }
          }

          course.units.values.push(unit);
        }
      }

      courses.values.push(course);
      this.logger.log(`✅ Added course: ${course.courseTitle} with ${course.units.values.length} units`);
    }

    this.logger.log(`🎉 Successfully created courses object with ${courses.values.length} courses`);
    this.logger.log(`🏗️ ===== FINISHED COURSES OBJECT CREATION =====`);
    return courses;
  }

  /**
   * Transform course hierarchy from LMS format to Elasticsearch format
   */
  private transformCourseHierarchyToElasticsearchFormat(courseHierarchy: any): any {
    const course = {
      courseTitle: courseHierarchy.title || courseHierarchy.name,
      progress: courseHierarchy.tracking?.progress || 0,
      units: {
        type: 'nested',
        values: []
      },
      courseId: courseHierarchy.courseId
    };

    // Transform modules to units (lessons are nested inside modules)
    if (courseHierarchy.modules && Array.isArray(courseHierarchy.modules)) {
      for (const module of courseHierarchy.modules) {
        const unit = {
          unitId: module.moduleId,
          unitTitle: module.title || module.name,
          progress: module.tracking?.progress || 0,
          contents: {
            type: 'nested',
            values: []
          }
        };

        // Transform lessons to contents
        if (module.lessons && Array.isArray(module.lessons)) {
          for (const lesson of module.lessons) {
            const content = {
              contentId: lesson.lessonId,
              lessonId: lesson.lessonId,
              type: lesson.format || lesson.type || 'text_and_media',
              tracking: {
                score: lesson.tracking?.score || null,
                timeSpent: lesson.tracking?.timeSpent || 0,
                progress: lesson.tracking?.completionPercentage || lesson.tracking?.progress || 0,
                lastAccessed: lesson.tracking?.lastAccessed || lesson.tracking?.updatedAt || null,
                attempt: lesson.tracking?.attempt?.attemptNumber || lesson.tracking?.attempt || 1,
                status: lesson.tracking?.status || 'not_started'
              },
              status: lesson.tracking?.status || 'not_started'
            };

            unit.contents.values.push(content);
          }
        }

        course.units.values.push(unit);
      }
    }

    return course;
  }

  /**
   * Handle assessment attempt start - mirrors LMS enrollment logic
   */
  async handleAssessmentAttemptStart(
    userId: string,
    testId: string,
    attemptId: string,
    tenantId: string,
    organisationId: string
  ): Promise<void> {
    if (!isElasticsearchEnabled()) {
      this.logger.debug('Elasticsearch is disabled, skipping assessment attempt start sync');
      return;
    }

    try {
      this.logger.log(`🔄 Handling assessment attempt start for userId: ${userId}, testId: ${testId}, attemptId: ${attemptId}`);

      // Step 1: Force sync user from microservice (mirrors LMS pattern)
      await this.forceSyncUserFromMicroservice(userId);

      // Step 2: Check if user exists in Elasticsearch
      const userExists = await this.checkUserDocumentExists(userId);
      if (!userExists) {
        this.logger.warn(`❌ User ${userId} not found in Elasticsearch after force sync, skipping assessment start update`);
        return;
      }

      // Step 3: Always update existing user document with assessment data
      // This preserves existing user data and adds assessment data
      await this.updateUserWithAssessmentData(userId, testId, attemptId, tenantId, organisationId);

      this.logger.log(`✅ Successfully handled assessment attempt start for userId: ${userId}, testId: ${testId}`);
    } catch (error) {
      this.logger.error(`❌ Failed to handle assessment attempt start for userId: ${userId}, testId: ${testId}:`, error);
      throw error;
    }
  }

  /**
   * Update existing user document with assessment data
   */
    private async updateUserWithAssessmentData(
    userId: string,
    testId: string,
    attemptId: string,
    tenantId: string,
    organisationId: string
  ): Promise<void> {
    try {
      this.logger.log(`🔄 Updating existing user document with assessment data for userId: ${userId}, testId: ${testId}`);

      const userData = await this.getUserFromElasticsearch(userId);
      if (!userData) {
        this.logger.error(`❌ User data not found for userId: ${userId}`);
      return;
    }

      this.logger.log(`✅ Found existing user data for userId: ${userId}`);

      // Step 1: Find course details for userId from LMS
      this.logger.log(`🔄 Step 1: About to call findCourseDetailsForUser`);
      const courseDetails = await this.findCourseDetailsForUser(userId, tenantId, organisationId);
      this.logger.log(`✅ Step 1: Completed findCourseDetailsForUser, got ${courseDetails.length} course details`);
      
      // Step 2: Map testId to lessonId through LMS service (optional for comprehensive courses)
      this.logger.log(`🔄 Step 2: About to call mapTestIdToLessonId for testId: ${testId}`);
      // ALWAYS include userId to prevent multiple user syncing
      const lessonId = await this.mapTestIdToLessonId(testId, tenantId, organisationId, userId);
      this.logger.log(`✅ Step 2: Completed mapTestIdToLessonId, lessonId: ${lessonId}`);
      
      // Note: We'll continue with comprehensive courses object creation even if lessonId mapping fails
      if (!lessonId) {
        this.logger.warn(`⚠️ Could not map testId ${testId} to lessonId, but will continue with comprehensive courses object creation`);
      }

      // Step 4: Create comprehensive courses object
      this.logger.log(`🔄 Step 4: Creating comprehensive courses object`);
      const coursesObject = this.createCoursesObjectForElasticsearch(courseDetails);
      this.logger.log(`✅ Step 4: Created comprehensive courses object with ${coursesObject.values.length} courses`);

      // Step 5: Find an existing application to update, or create a new one
      let targetApplication = null;
      
      if (userData.applications && Array.isArray(userData.applications)) {
        // Try to find an application that already has courses
        targetApplication = userData.applications.find(app => 
          app.courses && app.courses.values && app.courses.values.length > 0
        );
        
        if (targetApplication) {
          this.logger.log(`✅ Found existing application with courses: ${targetApplication.cohortId}`);
        } else {
          // Use the first application or create a default one
          targetApplication = userData.applications[0];
          this.logger.log(`✅ Using first application: ${targetApplication?.cohortId || 'default'}`);
        }
      }

      // If no applications exist, create a default one
      if (!targetApplication) {
        this.logger.log(`🔄 Creating default application for courses`);
        targetApplication = {
          cohortId: "default",
          cohortTitle: "Default Cohort",
          courses: { values: [], type: "nested" }
        };
        
        if (!userData.applications) {
          userData.applications = [];
        }
        userData.applications.push(targetApplication);
      }

      // Step 6: Update the target application's courses
      this.logger.log(`📝 Updating courses object in application with cohortId: ${targetApplication.cohortId}`);
      targetApplication.courses = coursesObject;
      this.logger.log(`✅ Step 6: Updated application courses with ${coursesObject.values.length} courses`);

      // Step 7: Update the document in Elasticsearch
      this.logger.log(`🔄 Step 7: Updating document in Elasticsearch`);
      await this.client.update({
        index: this.indexName,
        id: userId,
        body: {
          doc: userData
        }
      });

      this.logger.log(`✅ Successfully updated user document with assessment data for userId: ${userId}, testId: ${testId}`);
    } catch (error) {
      this.logger.error(`❌ Failed to update user document with assessment data for userId: ${userId}, testId: ${testId}:`, error);
      throw error;
    }
  }

  /**
   * Create complete user structure with assessment data
   */
  private async createCompleteUserStructureWithAssessment(
    userId: string,
    testId: string,
    attemptId: string,
    tenantId: string,
    organisationId: string
  ): Promise<void> {
    try {
      this.logger.log(`🔄 Creating complete user structure with assessment data for userId: ${userId}, testId: ${testId}`);

      let lessonInfo = await this.getLessonInfoFromTestId(testId, tenantId, organisationId, userId);
      if (!lessonInfo) {
        this.logger.warn(`⚠️ Using fallback lesson info for testId: ${testId}`);
        lessonInfo = {
          lessonId: testId,
          courseId: testId,
          moduleId: testId
        };
      }

      // Create fallback lesson info with additional properties if needed
      const fallbackLessonInfo = {
        ...lessonInfo,
        lessonTitle: `Assessment ${testId}`,
        unitId: lessonInfo.moduleId || testId // Use moduleId as unitId if available
      };

      // Fetch user profile from user microservice
      let userProfile = null;
      try {
        const headers: any = {
          'Content-Type': 'application/json'
        };

        const response = await axios.get(
          `${this.userMicroserviceUrl}/user/v1/profile/${userId}`,
          { headers }
        );

        if (response.status === 200 && response.data) {
          userProfile = response.data;
        }
    } catch (error) {
        this.logger.warn(`⚠️ Failed to fetch user profile for userId: ${userId}, using default profile`);
      }

      // Create default profile if fetch failed
      if (!userProfile) {
        userProfile = {
          userId: userId,
          username: `user_${userId}`,
          firstName: "User",
          lastName: "Default",
          middleName: "",
          email: `user_${userId}@example.com`,
          mobile: "",
          mobile_country_code: "",
          gender: "male",
          dob: "1990-01-01",
          country: "Unknown",
          address: "",
          district: "",
          state: "",
          pincode: "",
          status: "active",
          customFields: []
        };
      }

      // Fetch comprehensive course details from LMS
      this.logger.log(`🔄 Fetching comprehensive course details for userId: ${userId}`);
      const courseDetails = await this.findCourseDetailsForUser(userId, tenantId, organisationId);
      this.logger.log(`📊 Found ${courseDetails.length} course details for userId: ${userId}`);
      
      let coursesObject;
      if (courseDetails.length > 0) {
        // Create comprehensive courses object with all courses and their modules/lessons
        this.logger.log(`🏗️ Creating comprehensive courses object for ${courseDetails.length} courses`);
        coursesObject = this.createCoursesObjectForElasticsearch(courseDetails);
        this.logger.log(`✅ Created comprehensive courses object with ${coursesObject.values.length} courses`);
      } else {
        // Fallback to single assessment course if no LMS courses found
        this.logger.warn(`⚠️ No LMS courses found, creating fallback assessment course`);
        coursesObject = {
          type: "nested",
          values: [
            {
              courseTitle: `Assessment ${testId}`,
              progress: 0,
              units: {
                type: "nested",
                values: [
                  {
                    unitId: fallbackLessonInfo.unitId,
                    unitTitle: `Assessment Unit ${testId}`,
                    progress: 0,
                    contents: {
                      type: "nested",
                      values: [
                        {
                          contentId: lessonInfo.lessonId,
                          lessonId: lessonInfo.lessonId,
                          type: "assessment",
                          tracking: {
                            score: 0,
                            timeSpent: 0,
                            progress: 0,
                            lastAccessed: new Date().toISOString(),
                            attempt: 1,
                            status: "started",
                            params: null
                          },
                          status: "started"
                        }
                      ]
                    }
                  }
                ]
              },
              courseId: fallbackLessonInfo.courseId
            }
          ]
        };
      }

      // Create complete user structure
      const completeUserStructure = {
        userId: userId,
        profile: userProfile,
        applications: [
          {
            cohortId: lessonInfo.courseId,
            formId: "assessment-form",
            submissionId: "assessment-submission",
            cohortmemberstatus: "enrolled",
            formstatus: "active",
            completionPercentage: 0,
            progress: {
              pages: {},
              overall: { total: 0, completed: 0 }
            },
            lastSavedAt: new Date().toISOString(),
            submittedAt: new Date().toISOString(),
            cohortDetails: {
              name: `Assessment ${testId}`,
              type: "ASSESSMENT",
              status: "active"
            },
            courses: coursesObject
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Create the document in Elasticsearch
      await this.client.index({
        index: this.indexName,
        id: userId,
        body: completeUserStructure
      });

      this.logger.log(`✅ Successfully created complete user structure with assessment data for userId: ${userId}, testId: ${testId}`);
    } catch (error) {
      this.logger.error(`❌ Failed to create complete user structure with assessment data for userId: ${userId}, testId: ${testId}:`, error);
      throw error;
    }
  }

  /**
   * Update assessment with real data (for backward compatibility)
   */
  async updateAssessmentWithRealData(
    userId: string,
    testId: string,
    attemptId: string,
    tenantId: string,
    organisationId: string
  ): Promise<void> {
    // This method is kept for backward compatibility
    // It delegates to the new handleAssessmentAttemptStart method
    await this.handleAssessmentAttemptStart(userId, testId, attemptId, tenantId, organisationId);
  }

  /**
   * Handle assessment attempt answers (for backward compatibility)
   */
  async handleAssessmentAttemptAnswers(
    userId: string,
    testId: string,
    attemptId: string,
    tenantId: string,
    organisationId: string
  ): Promise<void> {
    // This method is kept for backward compatibility
    // It delegates to the new handleAssessmentAnswerSubmission method
    // The original handleAssessmentAnswerSubmission and handleAssessmentAttemptSubmission are removed.
    // This method is now effectively a no-op for the new logic.
    this.logger.debug(`handleAssessmentAttemptAnswers called for userId: ${userId}, testId: ${testId}, attemptId: ${attemptId}. No direct update of assessment answers in Elasticsearch as per new logic.`);
  }

  /**
   * Get testId from attemptId using testAttempts table
   */
  private async getTestIdFromAttemptId(attemptId: string): Promise<string | null> {
    try {
      this.logger.log(`🔍 Getting testId from attemptId: ${attemptId} using testAttempts table`);
      
      const testAttempt = await this.testAttemptRepository.findOne({
        where: { attemptId: attemptId },
        select: ['testId']
      });

      if (testAttempt && testAttempt.testId) {
        this.logger.log(`✅ Found testId: ${testAttempt.testId} for attemptId: ${attemptId}`);
        return testAttempt.testId;
      }

      this.logger.warn(`⚠️ No testId found for attemptId: ${attemptId}`);
      return null;
    } catch (error) {
      this.logger.error(`❌ Error getting testId from attemptId: ${attemptId}:`, error);
      return null;
    }
  }

  /**
   * Handle assessment attempt answers - new implementation
   * First calls handleAssessmentAttemptStart, then appends answerTracking data
   */
  async handleAssessmentAttemptAnswersNew(
    userId: string,
    attemptId: string,
    answersData: any[],
    tenantId: string,
    organisationId: string
  ): Promise<void> {
    if (!isElasticsearchEnabled()) {
      this.logger.debug('Elasticsearch is disabled, skipping assessment attempt answers sync');
      return;
    }

    try {
      this.logger.log(`🔄 ===== STARTING ASSESSMENT ATTEMPT ANSWERS HANDLING =====`);
      this.logger.log(`🔄 Handling assessment attempt answers for userId: ${userId}, attemptId: ${attemptId}`);

      // Step 1: Get testId from attemptId first (we need this for fallback)
      this.logger.log(`🔄 Step 1: Getting testId from attemptId: ${attemptId}`);
      const testId = await this.getTestIdFromAttemptId(attemptId);
      
      if (!testId) {
        this.logger.warn(`⚠️ Could not find testId for attemptId: ${attemptId}, skipping answerTracking update`);
        return;
      }

      this.logger.log(`✅ Step 1: Found testId: ${testId} for attemptId: ${attemptId}`);

      // Step 2: Find lessonId using the provided steps
      this.logger.log(`🔄 Step 2: Finding lessonId from attemptId: ${attemptId}`);
      
      // Skip the old method and directly search for actual lessonId in courses structure
      this.logger.log(`🔄 ENHANCED APPROACH: Directly searching for actual lessonId that contains testId: ${testId} in user's courses structure`);
      const actualLessonId = await this.findActualLessonIdFromTestId(userId, testId);
      
      if (actualLessonId) {
        this.logger.log(`✅ ENHANCED APPROACH: Found actual lessonId: ${actualLessonId} for testId: ${testId}`);
        
        // Step 3: Call handleAssessmentAttemptStart first (existing function)
        this.logger.log(`🔄 Step 3: Calling handleAssessmentAttemptStart for userId: ${userId}, testId: ${testId}, attemptId: ${attemptId}`);
        await this.handleAssessmentAttemptStart(userId, testId, attemptId, tenantId, organisationId);
        this.logger.log(`✅ Step 3: Successfully called handleAssessmentAttemptStart`);

        // Step 4: Append answerTracking data to the actual lessonId
        this.logger.log(`🔄 Step 4: Appending answerTracking data to actual lessonId: ${actualLessonId}`);
        await this.appendAnswerTrackingToLesson(userId, actualLessonId, answersData);
        this.logger.log(`✅ Step 4: Successfully appended answerTracking data`);

        this.logger.log(`✅ ===== COMPLETED ASSESSMENT ATTEMPT ANSWERS HANDLING (WITH ENHANCED APPROACH) =====`);
        return;
          } else {
        this.logger.warn(`⚠️ ENHANCED APPROACH: No actual lessonId found, using testId as last resort`);
        
        // LAST RESORT: Use testId as lessonId if all else fails
        const lastResortLessonId = testId;
        this.logger.log(`🔄 LAST RESORT: Using testId as lessonId: ${lastResortLessonId}`);
        
        // Step 3: Call handleAssessmentAttemptStart first (existing function)
        this.logger.log(`🔄 Step 3: Calling handleAssessmentAttemptStart for userId: ${userId}, testId: ${testId}, attemptId: ${attemptId}`);
        await this.handleAssessmentAttemptStart(userId, testId, attemptId, tenantId, organisationId);
        this.logger.log(`✅ Step 3: Successfully called handleAssessmentAttemptStart`);

        // Step 4: Append answerTracking data to the last resort lessonId
        this.logger.log(`🔄 Step 4: Appending answerTracking data to last resort lessonId: ${lastResortLessonId}`);
        await this.appendAnswerTrackingToLesson(userId, lastResortLessonId, answersData);
        this.logger.log(`✅ Step 4: Successfully appended answerTracking data`);

        this.logger.log(`✅ ===== COMPLETED ASSESSMENT ATTEMPT ANSWERS HANDLING (WITH LAST RESORT) =====`);
        return;
      }
    } catch (error) {
      this.logger.error(`❌ Failed to handle assessment attempt answers for userId: ${userId}, attemptId: ${attemptId}:`, error);
      throw error;
    }
  }

  /**
   * Handle assessment attempt submission - new implementation
   * First calls handleAssessmentAttemptStart, then appends answerTracking data
   */
  async handleAssessmentAttemptSubmissionNew(
    userId: string,
    attemptId: string,
    answersData: any[],
    tenantId: string,
    organisationId: string
  ): Promise<void> {
    if (!isElasticsearchEnabled()) {
      this.logger.debug('Elasticsearch is disabled, skipping assessment attempt submission sync');
      return;
    }

    try {
      this.logger.log(`🔄 ===== STARTING ASSESSMENT ATTEMPT SUBMISSION HANDLING =====`);
      this.logger.log(`🔄 Handling assessment attempt submission for userId: ${userId}, attemptId: ${attemptId}`);

      // Step 1: Get testId from attemptId first (we need this for fallback)
      this.logger.log(`🔄 Step 1: Getting testId from attemptId: ${attemptId}`);
      const testId = await this.getTestIdFromAttemptId(attemptId);
      
      if (!testId) {
        this.logger.warn(`⚠️ Could not find testId for attemptId: ${attemptId}, skipping answerTracking update`);
        return;
      }

      this.logger.log(`✅ Step 1: Found testId: ${testId} for attemptId: ${attemptId}`);

      // Step 2: Find lessonId using the provided steps
      this.logger.log(`🔄 Step 2: Finding lessonId from attemptId: ${attemptId}`);
      
      // Skip the old method and directly search for actual lessonId in courses structure
      this.logger.log(`🔄 ENHANCED APPROACH: Directly searching for actual lessonId that contains testId: ${testId} in user's courses structure`);
      const actualLessonId = await this.findActualLessonIdFromTestId(userId, testId);
      
      if (actualLessonId) {
        this.logger.log(`✅ ENHANCED APPROACH: Found actual lessonId: ${actualLessonId} for testId: ${testId}`);
        
        // Step 3: Call handleAssessmentAttemptStart first (existing function)
        this.logger.log(`🔄 Step 3: Calling handleAssessmentAttemptStart for userId: ${userId}, testId: ${testId}, attemptId: ${attemptId}`);
        await this.handleAssessmentAttemptStart(userId, testId, attemptId, tenantId, organisationId);
        this.logger.log(`✅ Step 3: Successfully called handleAssessmentAttemptStart`);

        // Step 4: Append answerTracking data to the actual lessonId
        this.logger.log(`🔄 Step 4: Appending answerTracking data to actual lessonId: ${actualLessonId}`);
        await this.appendAnswerTrackingToLesson(userId, actualLessonId, answersData);
        this.logger.log(`✅ Step 4: Successfully appended answerTracking data`);

        this.logger.log(`✅ ===== COMPLETED ASSESSMENT ATTEMPT SUBMISSION HANDLING (WITH ENHANCED APPROACH) =====`);
        return;
      } else {
        this.logger.warn(`⚠️ ENHANCED APPROACH: No actual lessonId found, using testId as last resort`);
        
        // LAST RESORT: Use testId as lessonId if all else fails
        const lastResortLessonId = testId;
        this.logger.log(`🔄 LAST RESORT: Using testId as lessonId: ${lastResortLessonId}`);
        
        // Step 3: Call handleAssessmentAttemptStart first (existing function)
        this.logger.log(`🔄 Step 3: Calling handleAssessmentAttemptStart for userId: ${userId}, testId: ${testId}, attemptId: ${attemptId}`);
        await this.handleAssessmentAttemptStart(userId, testId, attemptId, tenantId, organisationId);
        this.logger.log(`✅ Step 3: Successfully called handleAssessmentAttemptStart`);

        // Step 4: Append answerTracking data to the last resort lessonId
        this.logger.log(`🔄 Step 4: Appending answerTracking data to last resort lessonId: ${lastResortLessonId}`);
        await this.appendAnswerTrackingToLesson(userId, lastResortLessonId, answersData);
        this.logger.log(`✅ Step 4: Successfully appended answerTracking data`);

        this.logger.log(`✅ ===== COMPLETED ASSESSMENT ATTEMPT SUBMISSION HANDLING (WITH LAST RESORT) =====`);
        return;
      }
    } catch (error) {
      this.logger.error(`❌ Failed to handle assessment attempt submission for userId: ${userId}, attemptId: ${attemptId}:`, error);
      throw error;
    }
  }

  /**
   * Find lessonId from attemptId using the provided steps:
   * 1. attemptId -> testId (from testAttempts table)
   * 2. testId -> mediaId (from media table source column)
   * 3. mediaId -> lessonId (from lessons table)
   */
  private async findLessonIdFromAttemptId(attemptId: string): Promise<string | null> {
    try {
      this.logger.log(`🔍 ===== STARTING LESSON ID FINDING PROCESS =====`);
      this.logger.log(`🔍 Finding lessonId for attemptId: ${attemptId}`);

      // Step 1: Get testId from attemptId using testAttempts table
      this.logger.log(`🔍 Step 1: Getting testId from attemptId: ${attemptId} using testAttempts table`);
      const testId = await this.getTestIdFromAttemptId(attemptId);
      
      if (!testId) {
        this.logger.warn(`⚠️ Step 1: No testId found for attemptId: ${attemptId}`);
        return null;
      }

      this.logger.log(`✅ Step 1: Found testId: ${testId} for attemptId: ${attemptId}`);

      // Step 2: Get mediaId from testId using media table source column
      this.logger.log(`🔍 Step 2: Getting mediaId from testId: ${testId} using media table source column`);
      const mediaId = await this.findMediaIdFromTestId(testId);
      
      if (!mediaId) {
        this.logger.warn(`⚠️ Step 2: No mediaId found for testId: ${testId}`);
        
        // FALLBACK: If we can't find mediaId, use testId directly as lessonId
        // This is a common pattern in assessment systems where testId maps directly to lessonId
        this.logger.log(`🔄 FALLBACK: Using testId directly as lessonId: ${testId}`);
        this.logger.log(`🎯 ===== SUCCESSFULLY FOUND LESSON ID (FALLBACK): ${testId} =====`);
        return testId;
      }

      this.logger.log(`✅ Step 2: Found mediaId: ${mediaId} for testId: ${testId}`);

      // Step 3: Get lessonId from mediaId using lessons table
      this.logger.log(`🔍 Step 3: Getting lessonId from mediaId: ${mediaId} using lessons table`);
      const lessonId = await this.findLessonIdFromMediaId(mediaId);
      
      if (!lessonId) {
        this.logger.warn(`⚠️ Step 3: No lessonId found for mediaId: ${mediaId}`);
        
        // FALLBACK: If we can't find lessonId, use mediaId as lessonId
        this.logger.log(`🔄 FALLBACK: Using mediaId as lessonId: ${mediaId}`);
        this.logger.log(`🎯 ===== SUCCESSFULLY FOUND LESSON ID (FALLBACK): ${mediaId} =====`);
        return mediaId;
      }

      this.logger.log(`✅ Step 3: Found lessonId: ${lessonId} for mediaId: ${mediaId}`);
      this.logger.log(`🎯 ===== SUCCESSFULLY FOUND LESSON ID: ${lessonId} =====`);

      return lessonId;
    } catch (error) {
      this.logger.error(`❌ Error finding lessonId from attemptId: ${attemptId}:`, error);
      return null;
    }
  }

  /**
   * Find mediaId from testId using media table where source = testId
   * Since we can't directly access the LMS database, we'll use LMS service APIs
   */
  private async findMediaIdFromTestId(testId: string): Promise<string | null> {
    try {
      this.logger.log(`🔍 Searching for mediaId with source = '${testId}' using LMS service APIs`);
      
      // Use mapTestIdToLessonId to find lessonId for testId
      this.logger.log(`🔍 Using mapTestIdToLessonId to find lessonId for testId: ${testId}`);
      const lessonInfo = await this.mapTestIdToLessonId(testId, undefined, undefined);
      
      if (lessonInfo && lessonInfo.lessonId) {
        this.logger.log(`✅ Found lessonId: ${lessonInfo.lessonId} for testId: ${testId}`);
        // Use lessonId as mediaId since they're often the same in LMS service
        return lessonInfo.lessonId;
        } else {
        this.logger.warn(`⚠️ No lessonId found for testId: ${testId}`);
      }
      
      // Alternative approach: Try to find the lesson in the user's course hierarchy
      this.logger.log(`🔍 Attempting to find lesson in user's course hierarchy for testId: ${testId}`);
      
      // Note: This would require userId and tenantId which we don't have in this context
      // For now, we'll return null and let the calling function handle the fallback
      this.logger.warn(`⚠️ Cannot search course hierarchy without userId and tenantId`);
      
      return null;
    } catch (error) {
      this.logger.error(`❌ Error finding mediaId for testId ${testId}:`, error);
      return null;
    }
  }

  /**
   * Find lessonId from mediaId using lessons table
   * Since we can't directly access the LMS database, we'll use the mediaId as lessonId
   */
  private async findLessonIdFromMediaId(mediaId: string): Promise<string | null> {
    try {
      this.logger.log(`🔍 Searching for lessonId with mediaId = '${mediaId}' using LMS service APIs`);
      
      // Since we're using LMS service APIs, the mediaId from findMediaIdFromTestId
      // is actually the lessonId, so we can return it directly
      this.logger.log(`🔍 Using mediaId as lessonId: ${mediaId}`);
      this.logger.log(`🔍 Note: In LMS service pattern, mediaId and lessonId are often the same`);
      
      return mediaId;
    } catch (error) {
      this.logger.error(`❌ Error finding lessonId for mediaId ${mediaId}:`, error);
      return null;
    }
  }

  /**
   * Append answerTracking data to a specific lesson in the user's courses structure
   */
  private async appendAnswerTrackingToLesson(
    userId: string,
    lessonId: string,
    answersData: any[]
  ): Promise<void> {
    try {
      this.logger.log(`📝 ===== STARTING ANSWER TRACKING APPEND =====`);
      this.logger.log(`📝 Appending answerTracking data to lessonId: ${lessonId} for userId: ${userId}`);

      // Get current user data from Elasticsearch
      this.logger.log(`📝 Step 1: Getting current user data from Elasticsearch for userId: ${userId}`);
      const userData = await this.getUserFromElasticsearch(userId);
      
      if (!userData) {
        this.logger.error(`❌ User data not found for userId: ${userId}`);
        return;
      }

      this.logger.log(`✅ Step 1: Successfully retrieved user data from Elasticsearch`);

      // Find the specific lesson in the courses structure
      this.logger.log(`📝 Step 2: Searching for lessonId: ${lessonId} in user's courses structure`);
      let lessonFound = false;
      let lessonUpdated = false;
      let availableLessonIds: string[] = [];
      let fallbackLessonFound = false;

      if (userData.applications && Array.isArray(userData.applications)) {
        for (const application of userData.applications) {
      if (application.courses && application.courses.values) {
        for (const course of application.courses.values) {
          if (course.units && course.units.values) {
            for (const unit of course.units.values) {
              if (unit.contents && unit.contents.values) {
                for (const content of unit.contents.values) {
                      // Collect all available lessonIds for debugging
                  if (content.lessonId) {
                        availableLessonIds.push(content.lessonId);
                      }
                      if (content.contentId) {
                        availableLessonIds.push(content.contentId);
                      }

                      // Check if this content matches the lessonId
                      if (content.lessonId === lessonId || content.contentId === lessonId) {
                        this.logger.log(`✅ Step 2: Found lesson ${content.lessonId} in course ${course.courseId}, unit ${unit.unitId}`);
                        lessonFound = true;

                        // Check if tracking object exists, create if not
                        if (!content.tracking) {
                          this.logger.log(`📝 Creating new tracking object for lesson ${content.lessonId}`);
                          content.tracking = {
                              score: 0,
                              timeSpent: 0,
                              progress: 0,
                              lastAccessed: new Date().toISOString(),
                            attempt: 1,
                            status: "in_progress",
                            params: null
                          };
                        }

                        // Append answerTracking object after tracking
                        this.logger.log(`📝 Appending answerTracking object to lesson ${content.lessonId}`);
                        content.answerTracking = {
                          type: "nested",
                          values: answersData.map(answer => ({
                            score: answer.score || 0,
                            questionId: answer.questionId,
                            answer: answer.answer || "",
                            reviewStatus: answer.reviewStatus || "P",
                            submittedAt: new Date().toISOString()
                          }))
                        };

                        this.logger.log(`✅ Successfully appended answerTracking object with ${content.answerTracking.values.length} answers`);
                        lessonUpdated = true;
                        break;
                      }
                    }
                    if (lessonUpdated) break;
                  }
                  if (lessonUpdated) break;
                }
                if (lessonUpdated) break;
              }
              if (lessonUpdated) break;
            }
            if (lessonUpdated) break;
          }
        }
      }

      // Log all available lessonIds for debugging
      this.logger.log(`📊 Available lessonIds in courses structure: ${availableLessonIds.join(', ')}`);
      this.logger.log(`🔍 Searching for lessonId: ${lessonId} among ${availableLessonIds.length} available lessons`);

      if (!lessonFound) {
        this.logger.warn(`⚠️ Lesson ${lessonId} not found in user's courses structure`);
        this.logger.warn(`⚠️ This suggests the testId (${lessonId}) is not the same as the actual lessonId`);
        this.logger.warn(`⚠️ Available lessonIds: ${availableLessonIds.join(', ')}`);
        
        // FALLBACK: Try to find a lesson that might be related to this test
        // This could be a lesson with type "test" or "assessment"
        this.logger.log(`🔄 FALLBACK: Searching for test/assessment type lessons that might match testId: ${lessonId}`);
        
        if (userData.applications && Array.isArray(userData.applications)) {
          for (const application of userData.applications) {
            if (application.courses && application.courses.values) {
              for (const course of application.courses.values) {
                if (course.units && course.units.values) {
                  for (const unit of course.units.values) {
                    if (unit.contents && unit.contents.values) {
                      for (const content of unit.contents.values) {
                        // Look for test/assessment type content
                        if (content.type === "test" || content.type === "assessment" || 
                            content.contentType === "test" || content.contentType === "assessment") {
                          this.logger.log(`🔄 FALLBACK: Found test/assessment content: ${content.lessonId || content.contentId} (type: ${content.type || content.contentType})`);
                          
                          // Check if tracking object exists, create if not
                          if (!content.tracking) {
                            this.logger.log(`📝 Creating new tracking object for fallback lesson ${content.lessonId || content.contentId}`);
                            content.tracking = {
          score: 0,
          timeSpent: 0,
          progress: 0,
          lastAccessed: new Date().toISOString(),
                              attempt: 1,
                              status: "in_progress",
                              params: null
                            };
                          }

                          // Append answerTracking object after tracking
                          this.logger.log(`📝 Appending answerTracking object to fallback lesson ${content.lessonId || content.contentId}`);
                          content.answerTracking = {
                            type: "nested",
                            values: answersData.map(answer => ({
                              score: answer.score || 0,
                              questionId: answer.questionId,
                              answer: answer.answer || "",
                              reviewStatus: answer.reviewStatus || "P",
                              submittedAt: new Date().toISOString()
                            }))
                          };

                          this.logger.log(`✅ Successfully appended answerTracking object to fallback lesson with ${content.answerTracking.values.length} answers`);
                          fallbackLessonFound = true;
                          break;
                        }
                      }
                      if (fallbackLessonFound) break;
                    }
                    if (fallbackLessonFound) break;
                  }
                  if (fallbackLessonFound) break;
                }
                if (fallbackLessonFound) break;
              }
              if (fallbackLessonFound) break;
            }
            if (fallbackLessonFound) break;
          }
        }

        // SECOND FALLBACK: If no test/assessment lessons found, try to find any lesson
        // This is a last resort to ensure the answerTracking data is stored somewhere
        if (!fallbackLessonFound) {
          this.logger.log(`🔄 SECOND FALLBACK: No test/assessment lessons found, searching for any available lesson`);
          
          if (userData.applications && Array.isArray(userData.applications)) {
            for (const application of userData.applications) {
            if (application.courses && application.courses.values) {
              for (const course of application.courses.values) {
                if (course.units && course.units.values) {
                  for (const unit of course.units.values) {
                      if (unit.contents && unit.contents.values && unit.contents.values.length > 0) {
                        // Use the first available lesson as a last resort
                        const firstContent = unit.contents.values[0];
                        this.logger.log(`🔄 SECOND FALLBACK: Using first available lesson: ${firstContent.lessonId || firstContent.contentId} as fallback`);
                        
                        // Check if tracking object exists, create if not
                        if (!firstContent.tracking) {
                          this.logger.log(`📝 Creating new tracking object for second fallback lesson ${firstContent.lessonId || firstContent.contentId}`);
                          firstContent.tracking = {
                            score: 0,
                            timeSpent: 0,
                            progress: 0,
                            lastAccessed: new Date().toISOString(),
                            attempt: 1,
                            status: "in_progress",
                            params: null
                          };
                        }

                        // Append answerTracking object after tracking
                        this.logger.log(`📝 Appending answerTracking object to second fallback lesson ${firstContent.lessonId || firstContent.contentId}`);
                        firstContent.answerTracking = {
                          type: "nested",
                          values: answersData.map(answer => ({
                            score: answer.score || 0,
                            questionId: answer.questionId,
                            answer: answer.answer || "",
                            reviewStatus: answer.reviewStatus || "P",
                            submittedAt: new Date().toISOString()
                          }))
                        };

                        this.logger.log(`✅ Successfully appended answerTracking object to second fallback lesson with ${firstContent.answerTracking.values.length} answers`);
                        fallbackLessonFound = true;
                        break;
                      }
                    }
                    if (fallbackLessonFound) break;
                  }
                  if (fallbackLessonFound) break;
                }
                if (fallbackLessonFound) break;
              }
              if (fallbackLessonFound) break;
            }
          }
        }
      }

      // Update the document in Elasticsearch if any changes were made
      if (lessonUpdated || fallbackLessonFound) {
        this.logger.log(`📝 Step 3: Updating user document in Elasticsearch with answerTracking data`);
        await this.client.update({
          index: this.indexName,
          id: userId,
          body: {
            doc: userData
          }
        });
        this.logger.log(`✅ Step 3: Successfully updated user document in Elasticsearch`);
      } else {
        this.logger.warn(`⚠️ No lessons were updated, skipping Elasticsearch update`);
      }

      // Summary of what happened
      if (lessonUpdated) {
        this.logger.log(`🎯 SUCCESS: answerTracking data was appended to the exact lessonId: ${lessonId}`);
      } else if (fallbackLessonFound) {
        this.logger.log(`🔄 SUCCESS: answerTracking data was appended to a fallback lesson (testId ${lessonId} not found in courses)`);
      } else {
        this.logger.warn(`❌ FAILURE: Could not append answerTracking data to any lesson`);
      }

      this.logger.log(`✅ Step 4: Successfully appended answerTracking data`);
    } catch (error) {
      this.logger.error(`❌ Error appending answerTracking data to lessonId: ${lessonId}:`, error);
      throw error;
    }
  }

  /**
   * Find the actual lessonId that corresponds to a testId by searching through the user's courses structure
   * This is more reliable than using the testId as lessonId
   */
  private async findActualLessonIdFromTestId(userId: string, testId: string): Promise<string | null> {
    try {
      this.logger.log(`🔍 ===== STARTING ACTUAL LESSON ID FINDING =====`);
      this.logger.log(`🔍 Finding actual lessonId for testId: ${testId} by searching user's courses structure`);
      
      // Get current user data from Elasticsearch
      const userData = await this.getUserFromElasticsearch(userId);
      if (!userData || !userData.applications || userData.applications.length === 0) {
        this.logger.warn(`⚠️ No applications found for userId: ${userId}`);
        return null;
      }

      // Search through all applications and their courses
      for (const application of userData.applications) {
        if (!application.courses || !application.courses.values) {
          continue;
        }

        for (const course of application.courses.values) {
          if (!course.units || !course.units.values) {
            continue;
          }

          for (const unit of course.units.values) {
            if (!unit.contents || !unit.contents.values) {
              continue;
            }

            for (const content of unit.contents.values) {
              // Check if this is a test/assessment type content
              if (content.type === 'test' || content.type === 'assessment') {
                this.logger.log(`🔍 Found test/assessment content: ${content.lessonId} in course ${course.courseId}, unit ${unit.unitId}`);
                this.logger.log(`✅ Content type: ${content.type}, testId: ${content.testId || 'N/A'}`);
                
                // Check if this content actually contains the specific testId
                if (this.doesContentMatchTestId(content, testId)) {
                  this.logger.log(`🎯 SUCCESS: Found actual lessonId: ${content.lessonId} for testId: ${testId}`);
                  this.logger.log(`📍 Location: Course ${course.courseId}, Unit ${unit.unitId}`);
                  this.logger.log(`🎯 ===== SUCCESSFULLY FOUND ACTUAL LESSON ID: ${content.lessonId} =====`);
                  return content.lessonId;
                } else {
                  this.logger.log(`⚠️ Content ${content.lessonId} is test/assessment type but doesn't match testId: ${testId}`);
                }
              }
            }
          }
        }
      }

      this.logger.warn(`⚠️ No matching test/assessment content found for testId: ${testId} in user's courses structure`);
      return null;
    } catch (error) {
      this.logger.error(`❌ Error finding actual lessonId for testId: ${testId}:`, error);
      return null;
    }
  }

  private doesContentMatchTestId(content: any, testId: string): boolean {
    // Check various properties where the testId might be stored
    const possibleTestIdFields = [
      content.testId,
      content.assessmentId,
      content.source,
      content.reference,
      content.contentId,
      content.lessonId,
      content.id,
      content.mediaId,
      content.testId,
      content.assessmentId
    ];

    // Also check nested structures
    if (content.metadata) {
      possibleTestIdFields.push(
        content.metadata.testId,
        content.metadata.assessmentId,
        content.metadata.source,
        content.metadata.reference
      );
    }

    if (content.attributes) {
      possibleTestIdFields.push(
        content.attributes.testId,
        content.attributes.assessmentId,
        content.attributes.source,
        content.attributes.reference
      );
    }

    // Check if any of these fields match the testId
    const hasMatch = possibleTestIdFields.some(field => field === testId);
    
    if (hasMatch) {
      this.logger.log(`✅ Content ${content.lessonId || content.id} matches testId: ${testId}`);
      this.logger.log(`📍 Matching field found in content`);
    } else {
      this.logger.log(`❌ Content ${content.lessonId || content.id} does not match testId: ${testId}`);
      this.logger.log(`📍 Available fields: testId=${content.testId}, assessmentId=${content.assessmentId}, source=${content.source}, reference=${content.reference}, contentId=${content.contentId}, lessonId=${content.lessonId}, id=${content.id}, mediaId=${content.mediaId}`);
      
      // Log nested structures if they exist
      if (content.metadata) {
        this.logger.log(`📍 Metadata fields: testId=${content.metadata.testId}, assessmentId=${content.metadata.assessmentId}, source=${content.metadata.source}, reference=${content.metadata.reference}`);
      }
      if (content.attributes) {
        this.logger.log(`📍 Attributes fields: testId=${content.attributes.testId}, assessmentId=${content.attributes.assessmentId}, source=${content.attributes.source}, reference=${content.attributes.reference}`);
      }
    }

    return hasMatch;
  }

  /**
   * NEW FUNCTION: Handle assessment attempt answers with answerTracking
   * This function:
   * 1. Gets testId from attemptId
   * 2. Checks if user exists in Elasticsearch and has course data
   * 3. If user doesn't exist, calls handleAssessmentAttemptStart to get current user and courses
   * 4. Uses NEW LMS endpoint to get correct lessonId
   * 5. Appends answerTracking object to the specific lesson in courses
   * 6. Notes that submission data update requires separate API call
   */
  async handleAssessmentAttemptAnswersWithTracking(
    userId: string,
    attemptId: string,
    answersData: any[],
    tenantId: string,
    organisationId: string
  ): Promise<void> {
    // ANSWERS TRACKING FUNCTION - UNIQUE IDENTIFIER
    if (!isElasticsearchEnabled()) {
      this.logger.debug('Elasticsearch is disabled, skipping assessment attempt answers tracking');
      return;
    }

    try {
      this.logger.log(`🔄 ===== STARTING NEW ASSESSMENT ATTEMPT ANSWERS TRACKING =====`);
      this.logger.log(`🔄 Handling assessment attempt answers with tracking for userId: ${userId}, attemptId: ${attemptId}`);

      // Step 1: Get testId from attemptId using testAttempts table
      this.logger.log(`🔄 Step 1: Getting testId from attemptId: ${attemptId} using testAttempts table`);
      const testId = await this.getTestIdFromAttemptId(attemptId);
      if (!testId) {
        this.logger.error(`❌ Could not find testId for attemptId: ${attemptId}, cannot proceed with tracking`);
        return;
      }
      this.logger.log(`✅ Step 1: Found testId: ${testId} for attemptId: ${attemptId}`);

      // Step 2: Check if user exists in Elasticsearch and has course data
      this.logger.log(`🔄 Step 2: Checking if user ${userId} exists in Elasticsearch and has course data`);
      const userExists = await this.checkUserDocumentExists(userId);
      const userHasCourses = userExists ? await this.checkUserHasCompleteCourses(userId) : false;
      
      if (!userExists || !userHasCourses) {
        this.logger.log(`🔄 Step 2a: User ${userId} ${!userExists ? 'does not exist' : 'has no courses'} in Elasticsearch`);
        this.logger.log(`🔄 Step 2a: Calling handleAssessmentAttemptStart to fetch current user and courses data`);
        
        // Call handleAssessmentAttemptStart to get current user and courses (without changing it)
        await this.handleAssessmentAttemptStart(userId, testId, attemptId, tenantId, organisationId);
        this.logger.log(`✅ Step 2a: Successfully called handleAssessmentAttemptStart and got current user and courses data`);
        
        // Wait a moment for Elasticsearch to update
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        this.logger.log(`✅ Step 2: User ${userId} exists in Elasticsearch with complete course data`);
      }

      // Step 3: Find lessonId using NEW LMS endpoint (primary method)
      this.logger.log(`🔄 Step 3: Finding lessonId using NEW LMS endpoint: /lms-service/v1/lessons/test/${testId}`);
      this.logger.log(`🔍 Test ID being used: ${testId}`);
      this.logger.log(`🔍 Test ID type: ${typeof testId}`);
      this.logger.log(`🔍 Test ID length: ${testId.length}`);
      
      let lessonInfo = await this.mapTestIdToLessonId(testId, tenantId, organisationId, userId);
      let lessonId: string | null = null;
      this.logger.log(`🔍 Result from mapTestIdToLessonId: ${lessonInfo ? JSON.stringify(lessonInfo) : 'null'}`);
      
      if (lessonInfo && lessonInfo.lessonId) {
        this.logger.log(`✅ Step 3: NEW LMS API SUCCESS - Found lesson info for testId: ${testId}`);
        this.logger.log(`📍 Course ID: ${lessonInfo.courseId}`);
        this.logger.log(`📍 Module ID: ${lessonInfo.moduleId}`);
        this.logger.log(`📍 Lesson ID: ${lessonInfo.lessonId}`);
        
        // Use the lessonInfo to find the exact lesson in Elasticsearch
        const foundLessonId = await this.findLessonInElasticsearchByCourseModuleLesson(
          userId, 
          lessonInfo.courseId, 
          lessonInfo.moduleId, 
          lessonInfo.lessonId
        );
        
        if (foundLessonId) {
          lessonId = foundLessonId;
          this.logger.log(`✅ Step 3: Successfully found lesson in Elasticsearch: ${lessonId}`);
        } else {
          this.logger.warn(`⚠️ Step 3: Could not find lesson in Elasticsearch, will use fallback`);
          lessonId = null;
        }
      } else {
        this.logger.warn(`⚠️ Step 3: NEW LMS API failed, falling back to course hierarchy search`);
        this.logger.log(`⚠️ mapTestIdToLessonId returned: ${lessonInfo}`);
        
        // Step 3a: Search through user's course hierarchy to find lessonId
        this.logger.log(`🔄 Step 3a: Searching through user's course hierarchy for lessonId containing testId: ${testId}`);
        const courseHierarchyLessonId = await this.findLessonIdFromCourseHierarchy(userId, testId, tenantId, organisationId);
        
        if (courseHierarchyLessonId) {
          this.logger.log(`✅ Step 3a: Found lessonId: ${courseHierarchyLessonId} in course hierarchy for testId: ${testId}`);
          lessonId = courseHierarchyLessonId;
        } else {
          this.logger.warn(`⚠️ Step 3a: No lessonId found in course hierarchy for testId: ${testId}`);
          
          // Step 3b: Try the old fallback approach (keeping for compatibility)
          this.logger.log(`🔄 Step 3b: Trying old fallback approach for testId: ${testId}`);
          const mediaId = await this.findMediaIdFromTestId(testId);
          if (mediaId) {
            this.logger.log(`✅ Step 3b: Found mediaId: ${mediaId} for testId: ${testId}`);
            lessonId = await this.findLessonIdFromMediaId(mediaId);
            if (lessonId) {
              this.logger.log(`✅ Step 3b: Found lessonId: ${lessonId} for mediaId: ${mediaId}`);
            } else {
              this.logger.warn(`⚠️ Step 3b: No lessonId found for mediaId: ${mediaId}`);
            }
          } else {
            this.logger.warn(`⚠️ Step 3b: No mediaId found for testId: ${testId}`);
          }
        }
      }

      if (!lessonId) {
        this.logger.error(`❌ Could not find lessonId for testId: ${testId} using any method, cannot proceed with tracking`);
        return;
      }

      this.logger.log(`🎯 FINAL RESULT: Using lessonId: ${lessonId} for testId: ${testId}`);

      // Step 4: Append answerTracking object to the specific lesson in courses
      this.logger.log(`🔄 Step 4: Appending answerTracking object to lessonId: ${lessonId} in courses structure`);
      await this.appendAnswerTrackingToLessonInCourses(userId, lessonId, answersData);
      this.logger.log(`✅ Step 4: Successfully appended answerTracking object to lessonId: ${lessonId}`);

      // Step 5: Automatically update answerTracking with submission data
      this.logger.log(`🔄 Step 5: Automatically updating answerTracking with submission data for attemptId: ${attemptId}`);
      
      // Calculate submission data from answersData dynamically
      const totalMarks = answersData.length; // Each question is worth 1 mark
      const totalScore = this.calculateTotalScore(answersData);
      
      // Use dynamic values from answersData instead of hardcoding
      // Get reviewStatus from the first answer, or default to "P" if not available
      const reviewStatus = answersData[0]?.reviewStatus || "P";
      
      // Calculate result dynamically based on actual score vs total marks
      const result = totalScore >= (totalMarks * 0.6) ? "P" : "F"; // Pass if 60% or higher
      
      this.logger.log(`📊 Calculated submission data (dynamic):`, {
        score: totalScore,
        reviewStatus: reviewStatus,
        result: result,
        totalMarks: totalMarks,
        source: 'answersData (dynamic)'
      });
      
      // Automatically call updateAnswerTrackingAfterSubmission
      await this.updateAnswerTrackingAfterSubmission(userId, attemptId, {
        score: totalScore,
        reviewStatus: reviewStatus,
        result: result,
        totalMarks: totalMarks
      });
      
      this.logger.log(`✅ Step 5: Successfully updated answerTracking with dynamic submission data`);

      this.logger.log(`✅ ===== COMPLETED NEW ASSESSMENT ATTEMPT ANSWERS TRACKING =====`);
    } catch (error) {
      this.logger.error(`❌ Failed to handle assessment attempt answers with tracking for userId: ${userId}, attemptId: ${attemptId}:`, error);
      throw error;
    }
  }

  /**
   * Handle assessment attempt submission with tracking
   * This function:
   * 1. Gets testId from attemptId
   * 2. Ensures user exists in Elasticsearch with course data
   * 3. Finds lessonId using LMS API or course hierarchy
   * 4. Appends answerTracking object to the specific lesson in courses
   * 5. Automatically updates answerTracking with submission response data
   */
  async handleAssessmentAttemptSubmissionWithTracking(
    userId: string,
    attemptId: string,
    answersData: any[],
    tenantId: string,
    organisationId: string,
    submissionResponse?: {
      score: number;
      reviewStatus: string;
      result: string;
      totalMarks: number;
    }
  ): Promise<void> {
    // SUBMISSION TRACKING FUNCTION - UNIQUE IDENTIFIER
    if (!isElasticsearchEnabled()) {
      this.logger.debug('Elasticsearch is disabled, skipping assessment attempt submission tracking');
      return;
    }

    try {
      this.logger.log(`🔄 ===== STARTING NEW ASSESSMENT ATTEMPT SUBMISSION TRACKING =====`);
      this.logger.log(`🔄 Handling assessment attempt submission with tracking for userId: ${userId}, attemptId: ${attemptId}`);

      // Step 1: Get testId from attemptId using testAttempts table
      this.logger.log(`🔄 Step 1: Getting testId from attemptId: ${attemptId} using testAttempts table`);
      const testId = await this.getTestIdFromAttemptId(attemptId);
      if (!testId) {
        this.logger.error(`❌ Could not find testId for attemptId: ${attemptId}, cannot proceed with tracking`);
        return;
      }
      this.logger.log(`✅ Step 1: Found testId: ${testId} for attemptId: ${attemptId}`);

      // Step 2: Check if user exists in Elasticsearch and has course data
      this.logger.log(`🔄 Step 2: Checking if user ${userId} exists in Elasticsearch and has course data`);
      const userExists = await this.checkUserDocumentExists(userId);
      const userHasCourses = userExists ? await this.checkUserHasCompleteCourses(userId) : false;
      
      if (!userExists || !userHasCourses) {
        this.logger.log(`🔄 Step 2a: User ${userId} ${!userExists ? 'does not exist' : 'has no courses'} in Elasticsearch`);
        this.logger.log(`🔄 Step 2a: Calling handleAssessmentAttemptStart to fetch current user and courses data`);
        
        // Call handleAssessmentAttemptStart to get current user and courses (without changing it)
        await this.handleAssessmentAttemptStart(userId, testId, attemptId, tenantId, organisationId);
        this.logger.log(`✅ Step 2a: Successfully called handleAssessmentAttemptStart and got current user and courses data`);
        
        // Wait a moment for Elasticsearch to update
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        this.logger.log(`✅ Step 2: User ${userId} exists in Elasticsearch with complete course data`);
      }

      // Step 3: Find lessonId using NEW LMS endpoint (primary method)
      this.logger.log(`🔄 Step 3: Finding lessonId using NEW LMS endpoint: /lms-service/v1/lessons/test/${testId}`);
      this.logger.log(`🔍 Test ID being used: ${testId}`);
      this.logger.log(`🔍 Test ID type: ${typeof testId}`);
      this.logger.log(`🔍 Test ID length: ${testId.length}`);
      
      let lessonInfo = await this.mapTestIdToLessonId(testId, tenantId, organisationId, userId);
      let lessonId: string | null = null;
      this.logger.log(`🔍 Result from mapTestIdToLessonId: ${lessonInfo ? JSON.stringify(lessonInfo) : 'null'}`);
      
      if (lessonInfo && lessonInfo.lessonId) {
        this.logger.log(`✅ Step 3: NEW LMS API SUCCESS - Found lesson info for testId: ${testId}`);
        this.logger.log(`📍 Course ID: ${lessonInfo.courseId}`);
        this.logger.log(`📍 Module ID: ${lessonInfo.moduleId}`);
        this.logger.log(`📍 Lesson ID: ${lessonInfo.lessonId}`);
        
        // Use the lessonInfo to find the exact lesson in Elasticsearch
        const foundLessonId = await this.findLessonInElasticsearchByCourseModuleLesson(
          userId, 
          lessonInfo.courseId, 
          lessonInfo.moduleId, 
          lessonInfo.lessonId
        );
        
        if (foundLessonId) {
          lessonId = foundLessonId;
          this.logger.log(`✅ Step 3: Successfully found lesson in Elasticsearch: ${lessonId}`);
        } else {
          this.logger.warn(`⚠️ Step 3: Could not find lesson in Elasticsearch, will use fallback`);
          lessonId = null;
        }
      } else {
        this.logger.warn(`⚠️ Step 3: NEW LMS API failed, falling back to course hierarchy search`);
        this.logger.warn(`⚠️ mapTestIdToLessonId returned: ${lessonInfo}`);
        
        // Step 3a: Search through user's course hierarchy to find lessonId
        this.logger.log(`🔄 Step 3a: Searching through user's course hierarchy for lessonId containing testId: ${testId}`);
        const courseHierarchyLessonId = await this.findLessonIdFromCourseHierarchy(userId, testId, tenantId, organisationId);
        
        if (courseHierarchyLessonId) {
          this.logger.log(`✅ Step 3a: Found lessonId: ${courseHierarchyLessonId} in course hierarchy for testId: ${testId}`);
          lessonId = courseHierarchyLessonId;
        } else {
          this.logger.warn(`⚠️ Step 3a: No lessonId found in course hierarchy for testId: ${testId}`);
          
          // Step 3b: Try the old fallback approach (keeping for compatibility)
          this.logger.log(`🔄 Step 3b: Trying old fallback approach for testId: ${testId}`);
          const mediaId = await this.findMediaIdFromTestId(testId);
          if (mediaId) {
            this.logger.log(`✅ Step 3b: Found mediaId: ${mediaId} for testId: ${testId}`);
            lessonId = await this.findLessonIdFromMediaId(mediaId);
            if (lessonId) {
              this.logger.log(`✅ Step 3b: Found lessonId: ${lessonId} for mediaId: ${mediaId}`);
            } else {
              this.logger.warn(`⚠️ Step 3b: No lessonId found for mediaId: ${mediaId}`);
            }
          } else {
            this.logger.warn(`⚠️ Step 3b: No mediaId found for testId: ${testId}`);
          }
        }
      }

      if (!lessonId) {
        this.logger.error(`❌ Could not find lessonId for testId: ${testId} using any method, cannot proceed with tracking`);
        return;
      }

      this.logger.log(`🎯 FINAL RESULT: Using lessonId: ${lessonId} for testId: ${testId}`);

      // Step 4: Append answerTracking object to the specific lesson in courses
      this.logger.log(`🔄 Step 4: Appending answerTracking object to lessonId: ${lessonId} in courses structure`);
      await this.appendAnswerTrackingToLessonInCourses(userId, lessonId, answersData);
      this.logger.log(`✅ Step 4: Successfully appended answerTracking object to lessonId: ${lessonId}`);

      // Step 5: Automatically update answerTracking with submission data
      this.logger.log(`🔄 Step 5: Automatically updating answerTracking with submission data for attemptId: ${attemptId}`);
      
      let submissionData: {
        score: number;
        reviewStatus: string;
        result: string;
        totalMarks: number;
      };
      
      if (submissionResponse) {
        // Use the actual submission API response data
        submissionData = {
          score: submissionResponse.score,
          reviewStatus: submissionResponse.reviewStatus,
          result: submissionResponse.result,
          totalMarks: submissionResponse.totalMarks
        };
        
        this.logger.log(`📊 Using submission API response data:`, submissionData);
        this.logger.log(`📝 Source: Actual submission API response`);
      } else {
        // Fallback to calculated data from answersData (for backward compatibility)
        const totalMarks = answersData.length; // Each question is worth 1 mark
        const totalScore = this.calculateTotalScore(answersData);
        
        // Use dynamic values from answersData instead of hardcoding
        // Get reviewStatus from the first answer, or default to "P" if not available
        const reviewStatus = answersData[0]?.reviewStatus || "P";
        
        // Calculate result dynamically based on actual score vs total marks
        const result = totalScore >= (totalMarks * 0.6) ? "P" : "F"; // Pass if 60% or higher
        
        submissionData = {
          score: totalScore,
          reviewStatus: reviewStatus,
          result: result,
          totalMarks: totalMarks
        };
        
        this.logger.log(`📊 Calculated submission data (fallback):`, submissionData);
        this.logger.log(`📝 Source: Calculated from answersData (no submission response provided)`);
      }
      
      // Automatically call updateAnswerTrackingAfterSubmission
      await this.updateAnswerTrackingAfterSubmission(userId, attemptId, submissionData);
      
      this.logger.log(`✅ Step 5: Successfully updated answerTracking with submission data`);

      this.logger.log(`✅ ===== COMPLETED NEW ASSESSMENT ATTEMPT SUBMISSION TRACKING =====`);
    } catch (error) {
      this.logger.error(`❌ Failed to handle assessment attempt submission with tracking for userId: ${userId}, attemptId: ${attemptId}:`, error);
      throw error;
    }
  }

  /**
   * NEW FUNCTION: Append answerTracking object to specific lesson in courses structure
   * This function finds the lesson in the courses structure and appends answerTracking after tracking
   */
  private async appendAnswerTrackingToLessonInCourses(
    userId: string,
    lessonId: string,
    answersData: any[]
  ): Promise<void> {
    try {
      this.logger.log(`📝 ===== STARTING ANSWER TRACKING APPEND TO COURSES =====`);
      this.logger.log(`📝 Appending answerTracking object to lessonId: ${lessonId} in courses structure for userId: ${userId}`);

      // Step 1: Get current user data from Elasticsearch
      this.logger.log(`📝 Step 1: Getting current user data from Elasticsearch for userId: ${userId}`);
      const userData = await this.getUserFromElasticsearch(userId);
      if (!userData) {
        this.logger.error(`❌ User data not found for userId: ${userId}`);
        return;
      }
      this.logger.log(`✅ Step 1: Successfully retrieved user data from Elasticsearch`);

      // Step 2: Find the lesson in the courses structure
      this.logger.log(`📝 Step 2: Searching for lessonId: ${lessonId} in user's courses structure`);
      let lessonFound = false;
      let lessonPath = '';

      if (userData.applications && Array.isArray(userData.applications)) {
        for (const application of userData.applications) {
          if (application.courses && application.courses.values) {
            for (const course of application.courses.values) {
              if (course.units && course.units.values) {
                for (const unit of course.units.values) {
                  if (unit.contents && unit.contents.values) {
                    for (const content of unit.contents.values) {
                      if (content.lessonId === lessonId) {
                        lessonFound = true;
                        lessonPath = `Course: ${course.title || course.courseId}, Unit: ${unit.title || unit.unitId}, Lesson: ${content.title || content.lessonId}`;
                        
                        this.logger.log(`✅ Step 2: Found lesson ${lessonId} in courses structure`);
                        this.logger.log(`📍 Location: ${lessonPath}`);

                        // Step 3: Check if answerTracking already exists for this attemptId
                        this.logger.log(`📝 Step 3: Checking if answerTracking already exists for attemptId: ${answersData[0]?.attemptId}`);
                        
                        let existingAnswerTracking = null;
                        let existingIndex = -1;
                        
                        if (content.answerTracking && Array.isArray(content.answerTracking)) {
                          existingIndex = content.answerTracking.findIndex(tracking => tracking.attemptId === answersData[0]?.attemptId);
                          if (existingIndex !== -1) {
                            existingAnswerTracking = content.answerTracking[existingIndex];
                            this.logger.log(`✅ Found existing answerTracking for attemptId: ${answersData[0]?.attemptId} at index: ${existingIndex}`);
                          } else {
                            this.logger.log(`📝 No existing answerTracking found for attemptId: ${answersData[0]?.attemptId}, will create new one`);
                          }
                        } else {
                          this.logger.log(`📝 No answerTracking array exists, will create new one`);
                        }
                        
                        // Step 3.1: Enhance answers with question options text
                        this.logger.log(`📝 Step 3.1: Enhancing answers with question options text`);
                        const enhancedAnswers = await Promise.all(
                          answersData.map(async (answer) => {
                            let enhancedAnswer = { ...answer.answer };
                            
                            // If answer has selectedOptionIds, fetch the text values
                            if (answer.answer && answer.answer.selectedOptionIds && Array.isArray(answer.answer.selectedOptionIds)) {
                              try {
                                this.logger.log(`🔍 Fetching option texts for question ${answer.questionId} with ${answer.answer.selectedOptionIds.length} selected options`);
                                const optionTexts = await this.getQuestionOptionTexts(answer.answer.selectedOptionIds);
                                
                                if (optionTexts.length > 0) {
                                  enhancedAnswer = {
                                    ...answer.answer,
                                    text: optionTexts.join(', ') // Join multiple options with comma
                                  };
                                  this.logger.log(`✅ Enhanced answer for question ${answer.questionId} with text: "${enhancedAnswer.text}"`);
                                } else {
                                  this.logger.warn(`⚠️ No option texts found for question ${answer.questionId}, keeping original answer`);
                                  // Add empty text field to maintain consistency
                                  enhancedAnswer = {
                                    ...answer.answer,
                                    text: ''
                                  };
                                }
                              } catch (error) {
                                this.logger.warn(`⚠️ Failed to fetch option texts for question ${answer.questionId}:`, error.message);
                                // Keep original answer if enhancement fails, but add empty text field
                                enhancedAnswer = {
                                  ...answer.answer,
                                  text: ''
                                };
                              }
                            } else {
                              // If no selectedOptionIds, add empty text field for consistency
                              enhancedAnswer = {
                                ...answer.answer,
                                text: ''
                              };
                            }
                            
                            return {
                              questionId: answer.questionId,
                              answer: enhancedAnswer,
                              score: answer.score || 0,
                              reviewStatus: answer.reviewStatus || 'P'
                            };
                          })
                        );

                        // Create or update the answerTracking object
                        const answerTracking = {
                          attemptId: answersData[0]?.attemptId || 'unknown',
                          timestamp: new Date().toISOString(),
                          answers: enhancedAnswers,
                          totalAnswers: answersData.length,
                          totalScore: this.calculateTotalScore(answersData),
                          // Automatically set submission data dynamically
                          score: this.calculateTotalScore(answersData),
                          reviewStatus: answersData[0]?.reviewStatus || "P", // Use dynamic value from answersData
                          result: this.calculateTotalScore(answersData) >= (answersData.length * 0.6) ? "P" : "F", // Pass if 60% or higher
                          totalMarks: answersData.length, // Each question is worth 1 mark
                          updatedAt: new Date().toISOString()
                        };

                        // Initialize answerTracking array if it doesn't exist
                        if (!content.answerTracking) {
                          content.answerTracking = [];
                        }

                        if (existingAnswerTracking) {
                          // Update existing answerTracking object
                          this.logger.log(`📝 Step 3.2: Updating existing answerTracking object for attemptId: ${answersData[0]?.attemptId}`);
                          
                          // Preserve existing fields that shouldn't be overwritten
                          const updatedAnswerTracking = {
                            ...existingAnswerTracking,
                            ...answerTracking,
                            // Keep the original timestamp for creation, but add updatedAt
                            timestamp: existingAnswerTracking.timestamp,
                            updatedAt: new Date().toISOString(),
                            // Preserve submission data fields
                            score: answerTracking.score,
                            reviewStatus: answerTracking.reviewStatus,
                            result: answerTracking.result,
                            totalMarks: answerTracking.totalMarks,
                            totalScore: answerTracking.totalScore
                          };
                          
                          content.answerTracking[existingIndex] = updatedAnswerTracking;
                          this.logger.log(`✅ Successfully updated existing answerTracking object`);
                        } else {
                          // Create new answerTracking object
                          this.logger.log(`📝 Step 3.2: Creating new answerTracking object for attemptId: ${answersData[0]?.attemptId}`);
                          content.answerTracking.push(answerTracking);
                          this.logger.log(`✅ Successfully created new answerTracking object`);
                        }

                        this.logger.log(`✅ Step 3: Successfully appended answerTracking object with ${answersData.length} answers`);
                        this.logger.log(`📊 AnswerTracking details: ${answerTracking.totalAnswers} answers, total score: ${answerTracking.totalScore}`);
                        break;
                      }
                    }
                    if (lessonFound) break;
                  }
                  if (lessonFound) break;
                }
                if (lessonFound) break;
              }
              if (lessonFound) break;
            }
            if (lessonFound) break;
          }
        }
      }

      if (!lessonFound) {
        this.logger.warn(`⚠️ Lesson ${lessonId} not found in user's courses structure`);
        this.logger.warn(`⚠️ Cannot append answerTracking object`);
        return;
      }

      // Step 4: Update the user document in Elasticsearch
      this.logger.log(`📝 Step 4: Updating user document in Elasticsearch with answerTracking data`);
      await this.client.update({
        index: this.indexName,
        id: userId,
        body: {
          doc: {
            applications: userData.applications
          }
        }
      });

      this.logger.log(`✅ Step 4: Successfully updated user document in Elasticsearch`);
      this.logger.log(`🎯 SUCCESS: answerTracking object was appended to lesson ${lessonId} in courses structure`);
      this.logger.log(`📝 ===== FINISHED ANSWER TRACKING APPEND TO COURSES =====`);
    } catch (error) {
      this.logger.error(`❌ Failed to append answerTracking to lesson ${lessonId} in courses:`, error);
      throw error;
    }
  }

  /**
   * Test LMS API endpoint with comprehensive logging
   */
  async testLmsApiEndpoint(
    testId: string,
    tenantId?: string, 
    organisationId?: string
  ): Promise<any> {
    try {
      this.logger.log(`🧪 ===== TESTING LMS API ENDPOINT =====`);
      this.logger.log(`🧪 Test ID: ${testId}`);
      this.logger.log(`🧪 Test ID Type: ${typeof testId}`);
      this.logger.log(`🧪 Test ID Length: ${testId.length}`);
      this.logger.log(`🏢 Tenant ID: ${tenantId || 'NOT PROVIDED'}`);
      this.logger.log(`🏛️ Organisation ID: ${organisationId || 'NOT PROVIDED'}`);
      
      const lmsServiceUrl = this.configService.get<string>('LMS_SERVICE_URL') || 'http://localhost:4002';
      this.logger.log(`🧪 LMS Service URL: ${lmsServiceUrl}`);
      
      const apiUrl = `${lmsServiceUrl}/lms-service/v1/lessons/test/${testId}`;
      this.logger.log(`🧪 Full API URL: ${apiUrl}`);
      
      // Test with different headers
      const headers: any = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'AssessmentService/1.0'
      };
      
      // Add required headers if provided
      if (tenantId) {
        headers['tenantid'] = tenantId;
      }
      if (organisationId) {
        headers['organisationid'] = organisationId;
      }
      
      this.logger.log(`🧪 Request Headers:`, headers);
      this.logger.log(`🧪 Request Method: GET`);
      this.logger.log(`🧪 Request URL: ${apiUrl}`);
      
      // Log the exact curl command for manual testing
      this.logger.log(`📋 MANUAL TEST CURL COMMAND:`);
      this.logger.log(`📋 curl -X GET "${apiUrl}" -H "Content-Type: application/json" -H "tenantid: ${tenantId || 'YOUR_TENANT_ID'}" -H "organisationid: ${organisationId || 'YOUR_ORGANISATION_ID'}" -v`);
      
      const response = await axios.get(apiUrl, { headers });
      
      this.logger.log(`🧪 Response Status: ${response.status}`);
      this.logger.log(`🧪 Response Status Text: ${response.statusText}`);
      this.logger.log(`🧪 Response Headers:`, response.headers);
      this.logger.log(`🧪 Response Data:`, JSON.stringify(response.data, null, 2));
      
      // Analyze the response structure
      this.logger.log(`🧪 Response Structure Analysis:`);
      this.logger.log(`🧪 - Has response.data: ${!!response.data}`);
      this.logger.log(`🧪 - Has response.data.result: ${!!(response.data && response.data.result)}`);
      this.logger.log(`🧪 - Has response.data.result.lesson: ${!!(response.data && response.data.result && response.data.result.lesson)}`);
      
      if (response.data) {
        this.logger.log(`🧪 - Available top-level keys: ${Object.keys(response.data).join(', ')}`);
        if (response.data.result) {
          this.logger.log(`🧪 - Available result keys: ${Object.keys(response.data.result).join(', ')}`);
          if (response.data.result.lesson) {
            this.logger.log(`🧪 - Available lesson keys: ${Object.keys(response.data.result.lesson).join(', ')}`);
          }
        }
      }
      
      return {
        success: true,
        status: response.status,
        data: response.data,
        headers: response.headers,
        curlCommand: `curl -X GET "${apiUrl}" -H "Content-Type: application/json" -H "tenantid: ${tenantId || 'YOUR_TENANT_ID'}" -H "organisationid: ${organisationId || 'YOUR_ORGANISATION_ID'}" -v`
      };
    } catch (error: any) {
      this.logger.error(`🧪 LMS API Test Failed:`, error);
      this.logger.error(`🧪 Error Type:`, error.constructor.name);
      this.logger.error(`🧪 Error Message:`, error.message);
      this.logger.error(`🧪 Error Code:`, error.code);
      
      if (error.response) {
        this.logger.error(`🧪 Error Response Status: ${error.response.status}`);
        this.logger.error(`🧪 Error Response Data:`, JSON.stringify(error.response.data, null, 2));
        this.logger.error(`🧪 Error Response Headers:`, error.response.headers);
        
        // Additional error analysis
        this.logger.error(`🧪 Error Analysis:`);
        this.logger.error(`🧪 - HTTP Status: ${error.response.status}`);
        this.logger.error(`🧪 - Error Code: ${error.response.data?.params?.err || 'UNKNOWN'}`);
        this.logger.error(`🧪 - Error Message: ${error.response.data?.params?.errmsg || 'UNKNOWN'}`);
        this.logger.error(`🧪 - API ID: ${error.response.data?.id || 'UNKNOWN'}`);
        this.logger.error(`🧪 - API Version: ${error.response.data?.ver || 'UNKNOWN'}`);
      }
      
      this.logger.error(`🧪 Full Error Object:`, JSON.stringify(error, null, 2));
      
      return {
        success: false,
        error: error.message,
        response: error.response ? {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        } : null,
        curlCommand: `curl -X GET "http://localhost:4002/lms-service/v1/lessons/test/${testId}" -H "Content-Type: application/json" -H "tenantid: ${tenantId || 'YOUR_TENANT_ID'}" -H "organisationid: ${organisationId || 'YOUR_ORGANISATION_ID'}" -v`
      };
    }
  }

  /**
   * NEW FUNCTION: Find lessonId by searching through user's course hierarchy
   * This is a better fallback than database queries
   */
  private async findLessonIdFromCourseHierarchy(
    userId: string,
    testId: string,
    tenantId: string,
    organisationId: string
  ): Promise<string | null> {
    try {
      this.logger.log(`🔍 Searching through course hierarchy for lessonId containing testId: ${testId}`);
      
      // Get course details for the user (same as handleAssessmentAttemptStart)
      const courseDetails = await this.findCourseDetailsForUser(userId, tenantId, organisationId);
      
      if (!courseDetails || courseDetails.length === 0) {
        this.logger.warn(`⚠️ No course details found for userId: ${userId}`);
        return null;
      }
      
      this.logger.log(`🔍 Searching through ${courseDetails.length} courses for lessonId`);
      
      // Search through all courses, modules, and lessons
      for (const courseDetail of courseDetails) {
        const course = courseDetail.courseHierarchy;
        
        if (course.modules && Array.isArray(course.modules)) {
          for (const module of course.modules) {
            if (module.lessons && Array.isArray(module.lessons)) {
              for (const lesson of module.lessons) {
                // First check if the lesson itself contains the testId
                if (this.doesLessonMatchTestId(lesson, testId)) {
                  this.logger.log(`✅ Found lesson in course hierarchy: ${lesson.lessonId || lesson.id}`);
                  this.logger.log(`📍 Course: ${course.title || course.name}, Module: ${module.title || module.name}, Lesson: ${lesson.title || lesson.name}`);
                  return lesson.lessonId || lesson.id;
                }
                
                // Then check if any content within the lesson contains the testId
                if (lesson.contents && Array.isArray(lesson.contents)) {
                  for (const content of lesson.contents) {
                    if (this.doesContentMatchTestId(content, testId)) {
                      this.logger.log(`✅ Found content in lesson that matches testId: ${lesson.lessonId || lesson.id}`);
                      this.logger.log(`📍 Course: ${course.title || course.name}, Module: ${module.title || module.name}, Lesson: ${lesson.title || lesson.name}`);
                      return lesson.lessonId || lesson.id;
                    }
                  }
                }
                
                // Debug: Log lesson structure for first few lessons to understand the data format
                if (course.courseId === '6409e76a-48f1-42b3-abf2-c79b8170cf96' && module.title === 'Week 1') {
                  this.logger.log(`🔍 DEBUG: Lesson structure for lesson: ${lesson.title || lesson.name}`);
                  this.logger.log(`🔍 DEBUG: Lesson object keys: ${Object.keys(lesson).join(', ')}`);
                  this.logger.log(`🔍 DEBUG: Lesson full object: ${JSON.stringify(lesson, null, 2)}`);
                  
                  if (lesson.contents && Array.isArray(lesson.contents)) {
                    this.logger.log(`🔍 DEBUG: Lesson has ${lesson.contents.length} contents`);
                    lesson.contents.forEach((content, index) => {
                      this.logger.log(`🔍 DEBUG: Content ${index} keys: ${Object.keys(content).join(', ')}`);
                      this.logger.log(`🔍 DEBUG: Content ${index} full object: ${JSON.stringify(content, null, 2)}`);
                    });
                  }
                }
              }
            }
          }
        }
      }
      
      this.logger.warn(`⚠️ No lesson found in course hierarchy for testId: ${testId}`);
      return null;
    } catch (error) {
      this.logger.error(`❌ Error searching course hierarchy for testId ${testId}:`, error);
      return null;
    }
  }

  /**
   * Calculate total score from answers data, ensuring it's always a valid number
   * This prevents Elasticsearch parsing errors for the totalScore field
   */
  private calculateTotalScore(answersData: any[]): number {
    try {
      this.logger.log(`🔢 Calculating total score from ${answersData.length} answers`);
      
      let totalScore = 0;
      
      for (const answer of answersData) {
        const score = answer.score;
        
        // Handle different score types and ensure they're valid numbers
        if (typeof score === 'number') {
          if (isNaN(score) || !isFinite(score)) {
            this.logger.warn(`⚠️ Invalid score value for question ${answer.questionId}: ${score}, using 0`);
            totalScore += 0;
          } else {
            totalScore += score;
          }
        } else if (typeof score === 'string') {
          // Try to parse string scores
          const parsedScore = parseFloat(score);
          if (isNaN(parsedScore) || !isFinite(parsedScore)) {
            this.logger.warn(`⚠️ Invalid string score for question ${answer.questionId}: "${score}", using 0`);
            totalScore += 0;
          } else {
            totalScore += parsedScore;
          }
        } else {
          // Handle null, undefined, or other types
          this.logger.warn(`⚠️ Missing or invalid score for question ${answer.questionId}: ${score}, using 0`);
          totalScore += 0;
        }
      }
      
      // Ensure the result is a valid integer (Elasticsearch long type)
      const finalScore = Math.round(totalScore);
      
      this.logger.log(`✅ Total score calculated: ${totalScore} → rounded to: ${finalScore}`);
      
      return finalScore;
    } catch (error) {
      this.logger.error(`❌ Error calculating total score:`, error);
      // Return 0 as fallback to prevent Elasticsearch errors
      return 0;
    }
  }

  /**
   * Test the updateAnswerTrackingAfterSubmission function with sample data
   * This helps verify that the update logic is working correctly
   */
  async testAnswerTrackingUpdate(
    userId: string,
    attemptId: string
  ): Promise<any> {
    try {
      this.logger.log(`🧪 ===== TESTING ANSWER TRACKING UPDATE =====`);
      this.logger.log(`🧪 Testing update for userId: ${userId}, attemptId: ${attemptId}`);
      
      // Sample submission data for testing
      const testSubmissionData = {
        score: 25,
        reviewStatus: "R",
        result: "F",
        totalMarks: 30
      };
      
      this.logger.log(`🧪 Test submission data:`, testSubmissionData);
      
      // Call the update function
      await this.updateAnswerTrackingAfterSubmission(userId, attemptId, testSubmissionData);
      
      this.logger.log(`🧪 Test completed successfully`);
      
      return {
        success: true,
        message: "Test completed successfully",
        testData: testSubmissionData
      };
    } catch (error) {
      this.logger.error(`🧪 Test failed:`, error);
      return {
        success: false,
        error: error.message,
        testData: null
      };
    }
  }

  /**
   * Test database connection and inspect questionOptions table structure
   * This is a helper method for debugging database issues
   */
  async testQuestionOptionsTable(): Promise<any> {
    try {
      this.logger.log(`🔍 Testing database connection and inspecting questionOptions table`);
      
      // Test 1: Check if we can connect to the database
      this.logger.log(`🔍 Test 1: Testing database connection`);
      try {
        const testQuery = 'SELECT 1 as test';
        const testResult = await this.testAttemptRepository.query(testQuery);
        this.logger.log(`✅ Database connection successful:`, testResult);
      } catch (error) {
        this.logger.error(`❌ Database connection failed:`, error);
        return { error: 'Database connection failed', details: error.message };
      }
      
      // Test 2: Check if questionOptions table exists
      this.logger.log(`🔍 Test 2: Checking if questionOptions table exists`);
      try {
        const tableExists = await this.testAttemptRepository.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'questionOptions'
          ) as table_exists
        `);
        this.logger.log(`🔍 Table exists check:`, tableExists);
        
        if (tableExists && tableExists[0] && tableExists[0].table_exists) {
          this.logger.log(`✅ questionOptions table exists`);
        } else {
          this.logger.log(`❌ questionOptions table does not exist`);
          return { error: 'questionOptions table does not exist' };
        }
      } catch (error) {
        this.logger.error(`❌ Error checking table existence:`, error);
        return { error: 'Error checking table existence', details: error.message };
      }
      
      // Test 3: Get table structure
      this.logger.log(`🔍 Test 3: Getting table structure`);
      try {
        const tableStructure = await this.testAttemptRepository.query(`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_name = 'questionOptions'
          ORDER BY ordinal_position
        `);
        this.logger.log(`✅ Table structure:`, tableStructure);
        
        return {
          success: true,
          tableExists: true,
          structure: tableStructure
        };
      } catch (error) {
        this.logger.error(`❌ Error getting table structure:`, error);
        return { error: 'Error getting table structure', details: error.message };
      }
    } catch (error) {
      this.logger.error(`❌ Test failed:`, error);
      return { error: 'Test failed', details: error.message };
    }
  }

  /**
   * Get question option texts from the database
   * This function fetches the actual text values for selected option IDs
   * Uses the correct query structure: SELECT "text" FROM "questionOptions" WHERE "questionOptionId" IN (...)
   */
  private async getQuestionOptionTexts(optionIds: string[]): Promise<string[]> {
    try {
      this.logger.log(`🔍 Fetching question option texts for ${optionIds.length} option IDs`);
      this.logger.log(`🔍 Option IDs to fetch: ${optionIds.join(', ')}`);
      
      // Use the correct query structure as provided by the user
      const query = `
        SELECT "text" 
        FROM "questionOptions" 
        WHERE "questionOptionId" IN (${optionIds.map((_, index) => `$${index + 1}`).join(',')})
      `;
      
      this.logger.log(`🔍 Executing query: ${query}`);
      this.logger.log(`🔍 With parameters: ${JSON.stringify(optionIds)}`);
      
      const result = await this.testAttemptRepository.query(query, optionIds);
      
      this.logger.log(`🔍 Query result:`, result);
      
      if (result && Array.isArray(result) && result.length > 0) {
        const optionTexts = result
          .map(row => row.text)
          .filter(text => text != null && text !== '');
        
        this.logger.log(`✅ Successfully fetched ${optionTexts.length} option texts`);
        this.logger.log(`📝 Option texts: ${optionTexts.join(', ')}`);
        
        return optionTexts;
      } else {
        this.logger.warn(`⚠️ No option texts found for option IDs: ${optionIds.join(', ')}`);
        this.logger.warn(`⚠️ Query result was:`, result);
        return [];
      }
    } catch (error) {
      this.logger.error(`❌ Error fetching question option texts:`, error);
      this.logger.error(`❌ Error details:`, error);
      // Return empty array on error to prevent breaking the main flow
      return [];
    }
  }

  /**
   * Check if a lesson object itself contains the testId
   */
  private doesLessonMatchTestId(lesson: any, testId: string): boolean {
    // Check various properties where the testId might be stored at lesson level
    const possibleTestIdFields = [
      lesson.testId,
      lesson.assessmentId,
      lesson.source,
      lesson.reference,
      lesson.contentId,
      lesson.mediaId,
      lesson.id
    ];

    // Also check nested structures
    if (lesson.metadata) {
      possibleTestIdFields.push(
        lesson.metadata.testId,
        lesson.metadata.assessmentId,
        lesson.metadata.source,
        lesson.metadata.reference
      );
    }

    if (lesson.attributes) {
      possibleTestIdFields.push(
        lesson.attributes.testId,
        lesson.attributes.assessmentId,
        lesson.attributes.source,
        lesson.attributes.reference
      );
    }

    // Check if any of these fields match the testId
    const hasMatch = possibleTestIdFields.some(field => field === testId);
    
    if (hasMatch) {
      this.logger.log(`✅ Lesson ${lesson.lessonId || lesson.id} matches testId: ${testId}`);
      this.logger.log(`📍 Matching field found in lesson`);
    } else {
      this.logger.log(`❌ Lesson ${lesson.lessonId || lesson.id} does not match testId: ${testId}`);
      this.logger.log(`📍 Available lesson fields: testId=${lesson.testId}, assessmentId=${lesson.assessmentId}, source=${lesson.source}, reference=${lesson.reference}, contentId=${lesson.contentId}, mediaId=${lesson.mediaId}, id=${lesson.id}`);
      
      // Log nested structures if they exist
      if (lesson.metadata) {
        this.logger.log(`📍 Lesson metadata fields: testId=${lesson.metadata.testId}, assessmentId=${lesson.metadata.assessmentId}, source=${lesson.metadata.source}, reference=${lesson.metadata.reference}`);
      }
      if (lesson.attributes) {
        this.logger.log(`📍 Lesson attributes fields: testId=${lesson.attributes.testId}, assessmentId=${lesson.attributes.assessmentId}, source=${lesson.attributes.source}, reference=${lesson.attributes.reference}`);
      }
    }

    return hasMatch;
  }

  private async findLessonInElasticsearchByCourseModuleLesson(
    userId: string,
    courseId: string,
    moduleId: string,
    lessonId: string
  ): Promise<string | null> {
    try {
      this.logger.log(`🔍 Searching for lessonId: ${lessonId} in Elasticsearch for courseId: ${courseId} and moduleId: ${moduleId}`);
      
      // First, try to find the user document
      const userResponse = await this.client.get({
        index: this.indexName,
        id: userId
      });

      if (!userResponse._source) {
        this.logger.warn(`⚠️ User document not found for userId: ${userId}`);
        return null;
      }

      const userData = userResponse._source as any;
      
      // Search through the user's applications and courses to find the lesson
      if (userData.applications && Array.isArray(userData.applications)) {
        for (const application of userData.applications) {
          if (application.courses && application.courses.values) {
            for (const course of application.courses.values) {
              if (course.courseId === courseId) {
                this.logger.log(`✅ Found course: ${course.courseId}`);
                
                if (course.units && course.units.values) {
                  for (const unit of course.units.values) {
                    if (unit.unitId === moduleId) {
                      this.logger.log(`✅ Found module: ${unit.unitId}`);
                      
                      if (unit.contents && unit.contents.values) {
                        for (const content of unit.contents.values) {
                          if (content.lessonId === lessonId) {
                            this.logger.log(`✅ Found lesson: ${content.lessonId}`);
                            this.logger.log(`📍 Lesson found in course: ${course.courseTitle || course.courseId}, unit: ${unit.unitTitle || unit.unitId}`);
                            return lessonId;
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }

      this.logger.warn(`⚠️ Could not find lessonId: ${lessonId} in Elasticsearch for courseId: ${courseId} and moduleId: ${moduleId}`);
      return null;
    } catch (error) {
      this.logger.error(`❌ Error searching for lessonId: ${lessonId} in Elasticsearch:`, error);
      return null;
    }
  }

  /**
   * Update answer tracking data after assessment submission
   * This function updates the reviewStatus, result, and totalMarks in the answerTracking
   */
  async updateAnswerTrackingAfterSubmission(
    userId: string,
    attemptId: string,
    submissionData: {
      score: number;
      reviewStatus: string;
      result: string;
      totalMarks: number;
    }
  ): Promise<void> {
    try {
      this.logger.log(`📝 ===== UPDATING ANSWER TRACKING AFTER SUBMISSION =====`);
      this.logger.log(`📝 Updating answerTracking for attemptId: ${attemptId} with submission data:`, submissionData);
      this.logger.log(`📝 Submission data details:`, {
        score: submissionData.score,
        reviewStatus: submissionData.reviewStatus,
        result: submissionData.result,
        totalMarks: submissionData.totalMarks,
        scoreType: typeof submissionData.score,
        totalMarksType: typeof submissionData.totalMarks
      });

      // Step 1: Get current user data from Elasticsearch
      this.logger.log(`📝 Step 1: Getting current user data from Elasticsearch for userId: ${userId}`);
      const userData = await this.getUserFromElasticsearch(userId);
      if (!userData) {
        this.logger.error(`❌ User data not found for userId: ${userId}`);
        return;
      }
      this.logger.log(`✅ Step 1: Successfully retrieved user data from Elasticsearch`);
      this.logger.log(`🔍 User data structure:`, {
        hasApplications: !!userData.applications,
        applicationsCount: userData.applications?.length || 0
      });

      // Step 2: Find and update the answerTracking entry
      this.logger.log(`📝 Step 2: Searching for answerTracking with attemptId: ${attemptId}`);
      let answerTrackingUpdated = false;

      if (userData.applications && Array.isArray(userData.applications)) {
        for (const application of userData.applications) {
          if (application.courses && application.courses.values) {
            for (const course of application.courses.values) {
              if (course.units && course.units.values) {
                for (const unit of course.units.values) {
                  if (unit.contents && unit.contents.values) {
                    for (const content of unit.contents.values) {
                      if (content.answerTracking && Array.isArray(content.answerTracking)) {
                        for (const tracking of content.answerTracking) {
                          if (tracking.attemptId === attemptId) {
                            this.logger.log(`✅ Step 2: Found answerTracking entry for attemptId: ${attemptId}`);
                            
                            // Update the answerTracking entry with submission data
                            this.logger.log(`🔍 BEFORE UPDATE - Current tracking data:`, {
                              attemptId: tracking.attemptId,
                              currentScore: tracking.score,
                              currentReviewStatus: tracking.reviewStatus,
                              currentResult: tracking.result,
                              currentTotalMarks: tracking.totalMarks,
                              currentTotalScore: tracking.totalScore
                            });
                            
                            // Update the main tracking object
                            tracking.score = this.ensureValidNumber(submissionData.score);
                            tracking.reviewStatus = submissionData.reviewStatus;
                            tracking.result = submissionData.result;
                            tracking.totalMarks = this.ensureValidNumber(submissionData.totalMarks);
                            tracking.updatedAt = new Date().toISOString();
                            
                            // Update individual answer scores and reviewStatus if they exist
                            if (tracking.answers && Array.isArray(tracking.answers)) {
                              this.logger.log(`🔍 Updating ${tracking.answers.length} individual answers with submission data`);
                              
                              for (const answer of tracking.answers) {
                                this.logger.log(`🔍 BEFORE - Answer ${answer.questionId}: score=${answer.score}, reviewStatus=${answer.reviewStatus}`);
                                
                                // Update individual answer scores and reviewStatus
                                answer.score = this.ensureValidNumber(submissionData.score / tracking.answers.length); // Distribute total score
                                answer.reviewStatus = submissionData.reviewStatus;
                                
                                this.logger.log(`🔍 AFTER - Answer ${answer.questionId}: score=${answer.score}, reviewStatus=${answer.reviewStatus}`);
                              }
                            }
                            
                            // Recalculate totalScore based on updated individual scores
                            if (tracking.answers && Array.isArray(tracking.answers)) {
                              const newTotalScore = tracking.answers.reduce((sum, answer) => sum + (answer.score || 0), 0);
                              tracking.totalScore = this.ensureValidNumber(newTotalScore);
                              this.logger.log(`🔍 Recalculated totalScore: ${newTotalScore} → ${tracking.totalScore}`);
                            }
                            
                            answerTrackingUpdated = true;
                            this.logger.log(`✅ Step 2: Updated answerTracking with submission data`);
                            this.logger.log(`📊 AFTER UPDATE - Updated values:`, {
                              score: tracking.score,
                              reviewStatus: tracking.reviewStatus,
                              result: tracking.result,
                              totalMarks: tracking.totalMarks,
                              totalScore: tracking.totalScore,
                              updatedAt: tracking.updatedAt
                            });
                            
                            // Log the complete updated tracking object for verification
                            this.logger.log(`📋 COMPLETE UPDATED TRACKING OBJECT:`, JSON.stringify(tracking, null, 2));
                            break;
                          }
                        }
                        if (answerTrackingUpdated) break;
                      }
                    }
                    if (answerTrackingUpdated) break;
                  }
                  if (answerTrackingUpdated) break;
                }
                if (answerTrackingUpdated) break;
              }
              if (answerTrackingUpdated) break;
            }
            if (answerTrackingUpdated) break;
          }
        }
      }

      if (!answerTrackingUpdated) {
        this.logger.warn(`⚠️ AnswerTracking entry not found for attemptId: ${attemptId}`);
        this.logger.warn(`⚠️ Cannot update submission data`);
        return;
      }

      // Step 3: Update the user document in Elasticsearch
      this.logger.log(`📝 Step 3: Updating user document in Elasticsearch with updated answerTracking data`);
      await this.client.update({
        index: this.indexName,
        id: userId,
        body: {
          doc: {
            applications: userData.applications
          }
        }
      });

      this.logger.log(`✅ Step 3: Successfully updated user document in Elasticsearch`);
      this.logger.log(`🎯 SUCCESS: AnswerTracking updated after submission for attemptId: ${attemptId}`);
      this.logger.log(`📝 ===== FINISHED UPDATING ANSWER TRACKING AFTER SUBMISSION =====`);
    } catch (error) {
      this.logger.error(`❌ Failed to update answerTracking after submission for attemptId: ${attemptId}:`, error);
      throw error;
    }
  }

  /**
   * Ensure a value is a valid number for Elasticsearch
   * This prevents parsing errors when updating numeric fields
   */
  private ensureValidNumber(value: any): number {
    try {
      if (typeof value === 'number') {
        if (isNaN(value) || !isFinite(value)) {
          this.logger.warn(`⚠️ Invalid number value: ${value}, using 0`);
          return 0;
        }
        return Math.round(value); // Ensure it's an integer for Elasticsearch long type
      } else if (typeof value === 'string') {
        const parsed = parseFloat(value);
        if (isNaN(parsed) || !isFinite(parsed)) {
          this.logger.warn(`⚠️ Invalid string value: "${value}", using 0`);
          return 0;
        }
        return Math.round(parsed);
      } else {
        this.logger.warn(`⚠️ Invalid value type: ${typeof value}, value: ${value}, using 0`);
        return 0;
      }
    } catch (error) {
      this.logger.error(`❌ Error ensuring valid number for value ${value}:`, error);
      return 0;
    }
  }


}
